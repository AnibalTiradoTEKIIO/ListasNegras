/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/email', 'N/runtime', 'N/search', 'N/record', '../../lib/access_pac', '../../lib/functions_gbl'],
    (email, runtime, search, record, access_pac, functions) => {
        function getInputData(inputContext) {
                var pendingVendors = JSON.parse(inputContext.script.params.custscript_pending_vendors);
                log.debug('pendingVendors', pendingVendors);
                return pendingVendors;
            }

        function map(mapContext) {
            // Procesa cada registro individualmente
            const parametros = JSON.parse(mapContext.value);
            log.debug('map ~ parametros:', parametros)
            const datosAuth = functions.getCompanyInformation();
                 log.debug('datosAuth', datosAuth);
                const { COMPANY, MX_PLUS_CONFIG } = functions;
                 log.debug('COMPANY', COMPANY);
                const configAll = functions.getConfig();
                 log.debug('configAll', configAll);
                let services, apis
                if (configAll[MX_PLUS_CONFIG.FIELDS.TEST_MODE] == true) {
                    services = access_pac.testURL.services
                    apis = access_pac.testURL.apis
                } else {
                    services = access_pac.prodURL.services
                    apis = access_pac.prodURL.apis
                }

                const urlToken = access_pac.resolveURL(services, access_pac.accessPoints.authentication);
                 log.debug('urlToken', urlToken);

                const getToken = access_pac.getTokenAccess(urlToken, datosAuth[COMPANY.FIELDS.EMAIL]);
                const tokenSW = getToken.data.token;
                 log.debug('tokenSW', getToken.data.token);
                // let results = {};
                // let situacion = [];
                //     results = getListaNegra(services, tokenSW, parametros.rfc)
                //     log.debug('results', results);
                //     if (results.success) {
                //         situacion.push(results.situacion);
                //     } else {
                //         scriptContext.response.write({
                //             output: ''
                //         });
                //     }
                
                // log.debug('onRequest ~ situacion:', situacion)
                // results.data = parametros
                // results.situacion = situacion;
                // results.details = 'Se ha validado un proveedor';
                // scriptContext.response.write({
                //     output: JSON.stringify(results)
                // });
                
        }

        function reduce(context) {
            // // Consolida los resultados
            // for (let i in context.values) {
            //     // Procesa los resultados
            // }
        }

        function summarize(context) {
            // Envía un correo electrónico a los administradores
            email.send({
                author: runtime.getCurrentUser().id,
                recipients: ['admin@example.com'],
                subject: 'Proceso de Listas Negras',
                body: 'El proceso de Listas Negras ha terminado.'
            });
                N.search.create({
        type: 'customrecord_temp_data',
    }).run().each(function(result) {
        N.record.delete({
            type: 'customrecord_temp_data',
            id: result.id,
        });
        return true;
    });
        }
        const getListaNegra = (services, tokenSW, rfc) => {
            try {
                let responseResult = { success: false, error: '', situacion: '', details: '' };
                const urlTaxPayers = access_pac.resolveURL(services, access_pac.accessPoints.tax_payers);
                log.debug('getListaNegra ~ urlTaxPayers:', urlTaxPayers)
                const responseLN = https.get({
                    url: urlTaxPayers + rfc,
                    headers: { "Authorization": "Bearer " + tokenSW }
                });
                if (responseLN.code == 200) {
                    const data = JSON.parse(responseLN.body);
                    responseResult = { success: true, situacion: data.data.situacion_del_contribuyente };
                    editaEstado(rfc, responseResult.situacion);
                    return responseResult; 
                } else if (responseLN.code == 400) {
                    responseResult = { success: true, situacion: '' };
                    editaEstado(rfc, responseResult.situacion);
                    return responseResult;
                } else {
                    return responseResult = { success: false, error: 'Failed to get data. HTTP Status Code: ' + responseLN.code }
                }
            } catch (error) {
                log.error('getListaNegra ~ error:', error)
            }
        }

        // Edita el registro del Proveedor con su Estatus en la lista negra
        function editaEstado(rfc, valorStatus) {
            try {
                const fechConsulta = new Date();
                // log.debug({ title: 'fecha de Consulta', details: fechConsulta });
                const idVendor = getSearchId(rfc, 'custentity_mx_rfc', search.Type.VENDOR);
                // log.debug({ title: 'idVendor', details: idVendor });
                const idStatus = getSearchId(valorStatus, 'name', 'customrecord_efx_pp_sol_lco');
                // log.debug({ title: 'idStatus', details: idStatus });
                record.submitFields({
                    type: record.Type.VENDOR,
                    id: idVendor,
                    values: {
                        'custentity_efx_fe_lns_status': idStatus,
                        'custentity_efx_fe_lns_valida_date': fechConsulta
                    },
                    options: {
                        enablesourcing: true,
                        ignoreMandatoryFields: true
                    }
                    
                });
            } catch (error) {
                log.error({ title: 'Error editaEstado', details: error })
            }
        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });