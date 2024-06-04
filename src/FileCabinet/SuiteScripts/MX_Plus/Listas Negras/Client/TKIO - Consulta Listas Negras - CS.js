/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/ui/message', 'N/url', 'N/https', 'N/search', 'N/record'],
    /**
     * @param{currentRecord} currentRecord
     * @param{message} message
     * @param{url} url
     * @param{https} https
     * @param{search} search
     * @param{record} record
     */
    function (currentRecord, message, url, https, search, record) {
        /**
         * Function to be executed after page is initialized.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
        */
        function pageInit(scriptContext) {
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         * 
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

            try {

                let msgValida = message.create({
                    title: "Validando proveedores...",
                    message: "Espere mientras se validan los proveedores seleccionados",
                    type: message.Type.INFORMATION
                });
                msgValida.show();
                const currentRd = scriptContext.currentRecord;
                const sublistId = 'custpage_tkio_vendor'
                var arrSublist = [];
                var lineCount = currentRd.getLineCount(sublistId);
                for (let i = 0; i < lineCount; i++) {
                    var objSublist = {};
                    currentRd.selectLine({
                        sublistId: sublistId,
                        line: i
                    });

                    const check = currentRd.getCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'sublist_check'
                    });
                    // log.debug({ title: 'check', details: check })

                    if (check) {
                        objSublist.rfc = currentRd.getCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: 'sublist_pvd_rfc'
                        });
                        arrSublist.push(objSublist);
                    }
                }
                console.log('ARRSUBLIST',arrSublist);
                const serviceSL = url.resolveScript({
                    deploymentId: 'customdeploy_tkio_consulta_list_neg_s_sl',
                    scriptId: 'customscript_tkio_consulta_list_neg_s_sl',
                    params: {}
                });
                var headerObj = {
                    'Content-Type': 'text/plain'
                };
                let lengthSublist = arrSublist.length;
                let validados = 0;
                let completedVendors = 0;
                let updatePercentage = 0;
              for (let i = 0; i < arrSublist.length; i++) {
                const remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                if (remainingUsage < 100) {
                    // Crea una tarea Map/Reduce
                    const mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
                    mrTask.scriptId = 'customscript_TKIO_MR_Listas_Negras'; 
                    mrTask.deploymentId = 'customdeploy_TKIO_MR_Listas_Negras'; 
                    mrTask.params = {
                        custscript_pending_vendors: JSON.stringify(arrSublist)
                    };
                    mrTask.submit();
            
                    // Envía un correo electrónico a los administradores
                    email.send({
                        author: runtime.getCurrentUser().id,
                        recipients: ['anibal.tirado@tekiio.mx'], 
                        subject: 'Proceso de Listas Negras',
                        body: 'El proceso de Listas Negras continuará de manera programada. Se enviará un correo cuando haya terminado.'
                    });
            
                    // Termina la ejecución del client
                    break;
                }
                
                 else{   
                    var response = https.post.promise({
                        url: serviceSL,
                        body: JSON.stringify(arrSublist[i]),
                        headers: headerObj
                    })
                    .then(function(response){
                        console.log('RESPUESTA DE LA VALIDACION', response);
                        var responseBody= JSON.parse(response.body);
                            completedVendors++;
                         updatePercentage = Math.round((completedVendors / lengthSublist) * 100);
                         console.log('PORCENTAJE',updatePercentage);
                         updateProgressBar(updatePercentage);
    
                        log.debug({
                            title: 'Response',
                            details: response
                        });
                        if(completedVendors==lengthSublist){
                            msgValida.hide();
                            var msgPvdValid = message.create({
                                title: "Proveedor(es) Validado(s)",
                                message: "Se han validado los proveedores seleccionados",
                                type: message.Type.CONFIRMATION
                            });
                            msgPvdValid.show({ duration: 30000 });
                            setTimeout(function () {
                                window.location.reload();
                            }, 1000);
                            // setTimeout(function () {
                            //     const urlSuitlet = url.resolveScript({
                            //         deploymentId: 'customdeploy_tkio_consulta_list_neg_sl',
                            //         scriptId: 'customscript_tkio_consulta_list_neg_sl'
                            //     });
                            //     window.onbeforeunload = null;
                            //     window.open(urlSuitlet, '_self');
                            // }, 10000);  
                        }  
                    })
                    .catch(function onRejected(reason) {
                     
                        completedVendors++;
                        updatePercentage = Math.round((completedVendors / lengthSublist) * 100);
                        console.log('PORCENTAJE',updatePercentage);
                        updateProgressBar(updatePercentage);
                        if(completedVendors==lengthSublist){
                            msgValida.hide();
                            var msgPvdValid = message.create({
                                title: "Proveedor(es) Validado(s)",
                                message: "No se han logrado validar todos los proveedores, el porcentaje de validación es del "+updatePercentage+"%",
                                type: message.Type.CONFIRMATION
                            });
                            msgPvdValid.show({ duration: 30000 });
                            // setTimeout(function () {
                            //     const urlSuitlet = url.resolveScript({
                            //         deploymentId: 'customdeploy_tkio_consulta_list_neg_sl',
                            //         scriptId: 'customscript_tkio_consulta_list_neg_sl'
                            //     });
                            //     window.onbeforeunload = null;
                            //     window.open(urlSuitlet, '_self');
                            // }, 10000);  
                        }  
                      
                        log.debug({
                            title: 'Invalid Request: ',
                            details: reason
                        });
                    })
                }
                }
                //console.log('VALIDADOS',validados);
                //console.log('LENGTH SUBLIST',lengthSublist);
                //msgValida.hide();
                // setTimeout(function() {
                   
                // },50);
                
                // else {
                //     //msgValida.hide();
                //     var msgErrorRedir = message.create({
                //         title: "Error al validar",
                //         message: respuesta.details,
                //         type: message.Type.ERROR
                //     });
                //     msgErrorRedir.show({ duration: 30000 });  
                // } 
              }
           

              catch (e) {
                // msgValida.hide();
                var msgErrorRedir = message.create({
                    title: "Error al validar",
                    message: "Error al validar RFC en listas negras. " + e,
                    type: message.Type.ERROR
                });
                msgErrorRedir.show({ duration: 3000 });

                return false;
            }
              

                
             
                    // .then(function (response) {
                    //     var respuesta = JSON.parse(response.body);
                    //     console.log('.then ~ respuesta:', respuesta)
                    //     if (respuesta.success) {
                    //         msgValida.hide();
                    //         var msgPvdValid = message.create({
                    //             title: "Proveedor(es) Validado(s)",
                    //             message: respuesta.details,
                    //             type: message.Type.CONFIRMATION
                    //         });
                    //         msgPvdValid.show({ duration: 30000 });
                    //         setTimeout(function () {
                    //             const urlSuitlet = url.resolveScript({
                    //                 deploymentId: 'customdeploy_tkio_consulta_list_neg_sl',
                    //                 scriptId: 'customscript_tkio_consulta_list_neg_sl'
                    //             });
                    //             window.onbeforeunload = null;
                    //             window.open(urlSuitlet, '_self');
                    //         }, 10000);
                    //     } else {
                    //         msgValida.hide();
                    //         var msgErrorRedir = message.create({
                    //             title: "Error al validar",
                    //             message: respuesta.details,
                    //             type: message.Type.ERROR
                    //         });
                    //         msgErrorRedir.show({ duration: 3000 });
                    //     }
                    //     console.log({
                    //         title: 'Response',
                    //         details: respuesta
                    //     });

                    //     const todayConsulta = new Date().toLocaleDateString();
                    //     const situacionPvd = respuesta.situacion || '';
                    //     console.log('.then ~ situacionPvd:', situacionPvd)
                    //     for (let indexPvd = 0; indexPvd < situacionPvd.length; indexPvd++) {

                    //         currentRd.selectLine({
                    //             sublistId: sublistId,
                    //             line: indexPvd
                    //         });
                    //         currentRd.setCurrentSublistValue({
                    //             sublistId: sublistId,
                    //             fieldId: 'custpage_sublist_estatus',
                    //             value: situacionPvd[indexPvd]
                    //         });
                    //         // Guardar el valor de la fecha en la sublista
                    //         currentRd.setCurrentSublistValue({
                    //             sublistId: sublistId,
                    //             fieldId: 'sublist_date_consul',
                    //             value: todayConsulta
                    //         });
                    //     }

                    //     currentRd.commitLine({
                    //         sublistId: sublistId
                    //     });
                    //     // console.log('.then ~ arrSublist[0].rfc:', arrSublist[0].rfc)
                    //     // editaEstado(arrSublist[0].rfc, situacionPvd);
                    // })
                    // .catch(function onRejected(reason) {
                    //     console.error({
                    //         title: 'Invalid Request: ',
                    //         details: reason
                    //     });
                    // })

                // return true;

             
        }

        // Funcion para marcar los checkbox de el formulario
        function marcar() {
            try {
                const currentRec = currentRecord.get();
                const sublistId = 'custpage_tkio_vendor';
                const sublistLineCount = currentRec.getLineCount({
                    sublistId: sublistId
                });

                for (let i = 0; i < sublistLineCount; i++) {

                    currentRec.selectLine({
                        sublistId: sublistId,
                        line: i
                    });

                    currentRec.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'sublist_check',
                        value: true
                    });

                }

            } catch (e) {
                var msgErrorRedir = message.create({
                    title: "Error al marcar",
                    message: "Error al marcar. " + e,
                    type: message.Type.ERROR
                });
                msgErrorRedir.show({ duration: 3000 });
            }
        }

        // Funcion para desmarcar los checkbox de el formulario
        function desmarcar() {
            try {
                const currentRec = currentRecord.get();
                const sublistId = 'custpage_tkio_vendor';
                const sublistLineCount = currentRec.getLineCount({
                    sublistId: sublistId
                });

                for (let i = 0; i < sublistLineCount; i++) {
                    currentRec.selectLine({
                        sublistId: sublistId,
                        line: i
                    });

                    currentRec.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'sublist_check',
                        value: false
                    });

                }

            } catch (e) {
                var msgErrorRedir = message.create({
                    title: "Error al desmarcar",
                    message: "Error al desmarcar. " + e,
                    type: message.Type.ERROR
                });
                msgErrorRedir.show({ duration: 3000 });
            }
        }
      function updateProgressBar(percentage) {
            var progressBar = document.getElementById('progress-bar');
            var progressText = document.getElementById('progress-text');
            if (progressBar && progressText) {
                progressBar.style.width = percentage + '%';
                progressText.textContent = percentage + '%';
            }
       
        }

        return {
            pageInit: pageInit,
            marcar: marcar,
            desmarcar: desmarcar,
            updateProgressBar: updateProgressBar,
            // fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            saveRecord: saveRecord
        };

    });
