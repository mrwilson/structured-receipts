const StructuredReceipts = new function() {

    this.logReceiptProcessing = function logReceiptProcessing(m) {

        if (m.status === 'recognizing text') {
            var processAsPercentage = Math.floor(m.progress*100);

            processing.textContent = `Processing receipt... (${processAsPercentage}%)`
        }
    }

    this.mungeReceipt = function mungeReceipt(content) {
        if (content.includes("Sainsbury's")) {
            var receiptLines = content.split("\n");

            var balanceLine = receiptLines.findIndex(
                line => line.match(/\d+ BALANCE/)
            );

            return receiptLines
                .slice(0, balanceLine)
                .filter(line => line.includes("£"))
                .map(line => {
                    var fields = line.split(/[ ,]+/)

                    var product = fields
                        .slice(0, fields.length-2)
                        .join(" ")
                        .replace("*","");

                    var price = fields.slice(-1)[0].replace("£","");

                    return product + "," + price
                })
                .join("\n")
        }

        return content
    }

    this.downloadAsCsv = function downloadAsCsv() {
        let csvContent = "data:text/csv;charset=utf-8,product,price\r\n"
            + receipt.value.split("\n").join("\r\n");

        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "receipts.csv");

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    }

    this.parseReceipt = function parseReceipt(files) {
        var file = files[0];

        processing.style.visibility = 'visible';

        Tesseract.recognize(file, 'eng', { logger: this.logReceiptProcessing})
            .then(({ data: { text } }) => {
                processing.style.visibility = 'hidden';

                receipt.value = StructuredReceipts.mungeReceipt(text);
                receipt.style.height = receipt.scrollHeight+"px"
                receipt.style.visibility = 'visible';

                download_csv.style.visibility = 'visible';
            });
    };

};