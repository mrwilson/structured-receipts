const StructuredReceipts = new function() {

    this.logReceiptProcessing = function logReceiptProcessing(m) {

        if (m.status === 'recognizing text') {
            var processAsPercentage = Math.floor(m.progress*100);

            processing.textContent = `Processing receipt... (${processAsPercentage}%)`
        }
    }

    this.parseReceipt = function parseReceipt(files) {
        var file = files[0];

        processing.style.visibility = 'visible';

        Tesseract.recognize(file, 'eng', { logger: this.logReceiptProcessing})
            .then(({ data: { text } }) => {
                processing.style.visibility = 'hidden';

                receipt.value = text;
                receipt.style.height = receipt.scrollHeight+"px"
                receipt.style.visibility = 'visible';
            });
    };

};