# Structured Receipts

A small webpage to parse shopping receipts into better structured data, entirely client-side.

## How it works

The user can provide an image of a receipt either from a live camera (on mobile devices) or from local storage.

The app will perform some light image-processing before running the receipt through [Tesseract.js](https://tesseract.projectnaptha.com/) to perform optical character recognition (OCR).

Finally, either through auto-detection from the image's content or through the user's pre-defined retailer selection, the content will be transformed into a table of Quantity, Product, and Price.

This table is editable to enable the user to correct errors in the OCR process, or remove rows that were kept erroneously.

The data is available to download as CSV with the "Download" button