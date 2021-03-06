const StructuredReceipts = new function() {

    function operatingMode() {
        return retailers.selectedOptions[0].value;
    }

    function toTitleCase(input) {
        return input
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
            .join(" ");
    }

    function addRowToReceiptTable(quantity, product, price) {
        var newRow = receipt.insertRow();
        var quantityCell = newRow.insertCell()
        quantityCell.textContent = quantity;
        quantityCell.setAttribute('contenteditable','true');
        quantityCell.addEventListener('input', e => {
            if (e.target.innerText == 0) {
                receipt.deleteRow(newRow.rowIndex);
            }
        })

        var productCell = newRow.insertCell()
        productCell.textContent = toTitleCase(product);
        productCell.setAttribute('contenteditable','true');

        var priceCell = newRow.insertCell()
        priceCell.textContent = price;
        priceCell.setAttribute('contenteditable','true');
    }

    this.logReceiptProcessing = function logReceiptProcessing(m) {

        if (m.status === 'recognizing text') {
            var processAsPercentage = Math.floor(m.progress*100);

            if (operatingMode() == "auto") {
                processing.textContent = `Processing receipt... (${processAsPercentage}%)`
            } else {
                processing.textContent = `Processing ${operatingMode()} receipt... (${processAsPercentage}%)`
            }
        }
    }

    function getItemsOnlyFromReceipt(content, endsReceipt, validLine) {
        var receiptLines = content.split("\n");

        var lastLine = receiptLines.findIndex(endsReceipt);

        return receiptLines
            .slice(0, lastLine)
            .filter(validLine)
            .map(line => {
                var fields = line.split(/[ ,]+/)

                var product = fields
                    .slice(0, fields.length-1)
                    .join(" ")
                    .replace("*","");

                var price = fields.slice(-1)[0].replace("??","");

                return [1, product, price];
            });
    }

    this.mungeReceipt = function mungeReceipt(content) {
        if (operatingMode() == "sainsbury's") {
            getItemsOnlyFromReceipt(
                content,
                line => line.match(/\d+ BALANCE/),
                line => line.includes("??")
            )
            .forEach(validLine =>
                addRowToReceiptTable(validLine[0], validLine[1], validLine[2])
            );
        } else if (operatingMode() == "tesco") {
            getItemsOnlyFromReceipt(
                content,
                line => line.match(/total to pay/i),
                line => line.match(/.*\d+\.\d{2}/) != null
            )
            .forEach(validLine =>
                addRowToReceiptTable(validLine[0], validLine[1], validLine[2])
            );
        } else if (operatingMode() == "asda") {
            getItemsOnlyFromReceipt(
              content,
              line => line.match(/total.*.*\d+\.\d{2}/i),
              line => line.match(/.*\d+\.\d{2}/) != null
            )
            .map(line => {
                // Remove trailing characters from price column
                var cleanPrice = line[2].replace(/(\d+\.\d{2}).*/, (match, group) => group);

                return [line[0], line[1], cleanPrice];
            })
            .forEach(validLine =>
              addRowToReceiptTable(validLine[0], validLine[1], validLine[2])
            );
        } else {
            getItemsOnlyFromReceipt(
              content,
              // Don't attempt to find the total row as the type of receipt is unknown
              line => false,
              line => line.match(/.*\d+\.\d{2}/) != null
            )
            .forEach(validLine =>
              addRowToReceiptTable(validLine[0], validLine[1], validLine[2])
            );
        }

        receipt.style.visibility = 'visible';
        download_csv.style.visibility = 'visible';
    }

    this.downloadAsCsv = function downloadAsCsv() {
        let dataUrlHeader = "data:text/csv;charset=utf-8,"
        let csvContent = [...receipt.rows]
            .map(
                row => [...row.children].map(cell => cell.innerText).join(",")
            )
            .join("\r\n");

        let encodedUri = encodeURI(dataUrlHeader + csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "receipts.csv");

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    }

    let thresholdImageToBlackAndWhite = function thresholdImageToBlackAndWhite(pixels) {
        var threshold = Math.floor(0.6 * 255);

        for (let i = 0; i < pixels.length; i += 4) {
            const red = pixels[i];
            const green = pixels[i+1];
            const blue = pixels[i+2];

            if ([red, green, blue].some(colour => colour > threshold)) {
                pixels[i] = pixels[i+1] = pixels[i+2] = 255;
            } else {
                pixels[i] = pixels[i+1] = pixels[i+2] = 0;
            }
        }
    }

    this.parseReceipt = function parseReceipt(files) {
        var file = files[0];
        var ctx = hidden_canvas.getContext('2d');

        var reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function() {
            var image = new Image();
            image.onload = function() {
                // Draw the uploaded image on the Canvas
                hidden_canvas.width = image.width;
                hidden_canvas.height = image.height;
                ctx.drawImage(image, 0, 0);

                // Threshold the image into black and white
                var imageData = ctx.getImageData(0,0, hidden_canvas.width, hidden_canvas.height);
                thresholdImageToBlackAndWhite(imageData.data);
                ctx.putImageData(imageData, 0, 0);

                processing.style.visibility = 'visible';

                Tesseract.recognize(
                        hidden_canvas,
                        'eng',
                        { logger: m => StructuredReceipts.logReceiptProcessing(m)}
                    )
                    .then(({ data: { confidence, text } }) => {
                        processing.style.visibility = 'hidden';

                        StructuredReceipts.mungeReceipt(text);

                    });
            }
            image.src = reader.result;
        }
    };

};