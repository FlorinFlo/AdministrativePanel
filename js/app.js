printerList = [];
        $(window).on('load', function () {
            $.get("http://127.0.0.1:8080/webApp/webapi/service/hello", function (jsonObjectWithPrinters) {                              
                collectPrintersDataFromJson(jsonObjectWithPrinters.printers);
                populateDiplayedList();
            });
        });

        function populateDiplayedList() {
            var displayList = $('ul#printerList');
            $.each(printerList, function (index, printer) {
                var checkBox = $('<input/>', {
                    type: 'checkbox'
                    , style: 'float:right'
                }).attr('name','checkBox').attr('id', printer.name);
                var li = $('<li/>').addClass('list-group-item')
                    .append(checkBox)
                    .append((document.createTextNode(printer.name)));
                displayList.append(li);
                if ($('ul#printerList li').length > 5) $('ul#printerList').css('overflow-y', 'scroll');
            });
        }

        function collectPrintersDataFromJson(printers) {
            $.each(printers, function (index, printer) {                
                printer = {
                    hostId: printer.hostId
                    , printerId: printer.printerId
                    , name: printer.identity.displayName
                }
                printerList.push(printer);
            });
        }

        function selectAllPrinters(source) {
            $('#selectAll').change(function () {
                $('#printerList input').each(function () {
                    $(this).prop('checked', source.checked);
                });
            });
        }

        function downloadFile(url, onSuccess) {
            console.log("download file");
            var xmlHttpRequest = new XMLHttpRequest();
            xmlHttpRequest.responseType = 'blob';
            xmlHttpRequest.onreadystatechange = function () {
                if (xmlHttpRequest.status == 200) {
                    if (onSuccess) {
                        onSuccess(xmlHttpRequest.response);
                    }
                }
            }
            xmlHttpRequest.open("GET", url, true);
            xmlHttpRequest.send();
        }

        function blobToBase64(blob, callback) {
            //for internet explorer =>11
            var reader = new FileReader();
            reader.onload = function () {
                var dataUrl = reader.result;
                var byteString = dataUrl.split(',')[1];
                callback(byteString);
            };
            if (blob != null) {
                reader.readAsDataURL(blob);
            }
        }

        function createZipAndDownload() {
            var content = zip.generateAsync({
                type: "blob"
            }).then(function (content) {
                $('<a/>', {
                    href: URL.createObjectURL(content)
                    , download: "download.zip"
                    , style: "none"
                }).attr('id', "invisibleLink").appendTo($('body'));
                $('#invisibleLink')[0].click();                
                hideLoading();
                $('#invisibleLink')[0].remove();
            });
        }

        function prepareFileForZip(binaryData) {
            var fileName = urls[count].substring(urls[count].lastIndexOf('/') + 1);
            zip.file(fileName, binaryData, {
                base64: true
            });
        }

        function downloadComplete(blobData) {
            if (count < urls.length) {
                blobToBase64(blobData, function (binaryData) {
                    prepareFileForZip(binaryData);
                    if (count < urls.length - 1) {
                        count++;
                        downloadFile(urls[count], downloadComplete);
                    }
                    else {
                        //add cvs file to zip
                        zip.file("princh_settings.cfg", createCvsForSelectedPrinters());
                        // all files have been downloaded, create the zip
                        createZipAndDownload();
                    }
                });
            }
        }

        function downloadCVSFile() {
            $('<a/>', {
                href: 'data:attachment/cfg,' + encodeURI(createCvsForSelectedPrinters())
                , download: "princh_settings.cfg"
                , style: "none"
            }).attr('id', "invisibleLink").appendTo($('body'));
            $('#invisibleLink')[0].click();
            $('#invisibleLink')[0].remove();
        }

        function getSelectedPrinters() {
            var idSelectedPrinter = [];
            $('#printerList input').each(function () {
                if ($(this).is(":checked")) {
                    idSelectedPrinter.push($(this).attr("id"));
                }
            })
            return idSelectedPrinter;
        }

        function downloadZip() {
            urls = ["https://public-princh-files.s3.amazonaws.com/PFD/Distribution/2.1.0/PrinchDesktopSetup.msi"
                    , "https://public-princh-files.s3.amazonaws.com/PFD/Distribution/2.1.0/PrinchDesktopSetup_x64.msi"];
            count = 0;
            showLoading();
            zip = new JSZip();
            downloadFile(urls[count], downloadComplete);
        }

        function createCvsForSelectedPrinters() {
            var cvsString = "";
            $.each(getSelectedPrinters(), function (index, printerName) {
                $.each(printerList, function (index, printer) {
                    if (printer.name === printerName) {
                        cvsString += printer.hostId + "," + printer.printerId + "," + printer.name + "\n";
                    }
                })
            })
            return cvsString;
        }

    function showLoading(){
        
      $('#page .loader').show();
    }
function hideLoading(){
        
      $('#page .loader').hide();
    }