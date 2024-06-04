/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/log', 'N/https', 'N/record', '../../lib/access_pac', '../../lib/functions_gbl'],

    (search, log, https, record, access_pac, functions) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {search} search
         * @param {log} log
         * @param {record} record 
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            try {
                var arrVendors = getVendors();
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
                // log.debug('urlToken', urlToken);
    
                const getToken = access_pac.getTokenAccess(urlToken, datosAuth[COMPANY.FIELDS.EMAIL]);
                const tokenSW = getToken.data.token;
                // log.debug('execute ~ tokenSW:', tokenSW)
                var situacionPvd = '';
                arrVendors.forEach((vendor) => {
                    var validaPvd = getListaNegra(services, tokenSW, vendor.custentity_mx_rfc);
                    if (validaPvd.success) {
                        situacionPvd = validaPvd.situacion;
                        log.debug('arrVendors.forEach ~ situacionPvd:', situacionPvd)
                        // Edita el status y la fecha de consulta del proveedor
                        editaEstado(vendor.custentity_mx_rfc, situacionPvd);
                    } else {
                        log.error('Error de getListaNegra', validaPvd.error)
                        return;
                    }
                })     
            } catch (error) {
                log.error('execute ~ error:', error)
            }
        }
        // Buscar a los proveedores 
        function getVendors() {
            try {
                var arrPvd = [];
                var vendors_recordSearchObj = search.create({
                    type: search.Type.VENDOR,
                    filters:
                        [
                            search.createFilter({
                                name: 'custentity_mx_rfc',
                                operator: search.Operator.ISNOTEMPTY
                            })
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalId", label: "Id" }),
                            search.createColumn({ name: "entityid", sort: search.Sort.ASC, label: "Proveedor" }),
                            search.createColumn({ name: "custentity_mx_rfc", label: "RFC" }),
                            search.createColumn({ name: "custentity_efx_fe_lns_status", label: "Estatus" }),
                            search.createColumn({ name: "custentity_efx_fe_lns_valida_date", label: "Fecha de Consulta" })
                        ]
                });

                vendors_recordSearchObj.run().each(function (result) {
                    // log.debug({ title: 'result', details: result });
                    arrPvd.push({
                        internalId: result.getValue({ name: 'internalId' }) || ' ',
                        entityid: result.getValue({ name: 'entityid' }) || ' ',
                        custentity_mx_rfc: result.getValue({ name: 'custentity_mx_rfc' }) || ' ',
                        custentity_efx_fe_lns_status: result.getText({ name: 'custentity_efx_fe_lns_status' }) || ' ',
                        custentity_efx_fe_lns_valida_date: result.getValue({ name: 'custentity_efx_fe_lns_valida_date' }) || ' '
                    })
                    return true;
                });
                return arrPvd;
            } catch (e) {
                log.error({ title: 'Error obtenInfoProveedores:', details: e });
                return [];
            }

        }

        // Obtener la situación del contribuyente en la lista negra de Smarter Web
        function getListaNegra(services, tokenSW, rfc) {
            var dataReturn = { success: false, error: '', situacion: '' }
            try {
                const urlTaxPayers = access_pac.resolveURL(services, access_pac.accessPoints.tax_payers);
                // log.debug('getListaNegra ~ urlTaxPayers:', urlTaxPayers)
                var responseLN = https.get({
                    url: urlTaxPayers + rfc,
                    headers: { "Authorization": "Bearer " + tokenSW }
                });
                // log.debug({ title: 'responseLN', details: responseLN });

                if (responseLN.code == 200) {
                    var data = JSON.parse(responseLN.body);
                    log.debug({ title: 'data', details: data });
                    dataReturn.situacion = data.data.situacion_del_contribuyente;
                    dataReturn.success = true;
                } else if (responseLN.code == 400) {
                    dataReturn.situacion = '';
                    dataReturn.success = true;
                } else {
                    dataReturn.success = false; 
                    dataReturn.error = 'Failed to get data. HTTP Status Code: ' + responseLN.code;
                }

            } catch (error) {
                log.error({ title: 'getListaNegra', details: error });
                dataReturn.success = false;
                dataReturn.error = error;
            }
            return dataReturn;
        }

        // Edita el registro del Proveedor con su Estatus en la lista negra
        function editaEstado(rfc, valorStatus) {
            try {
                let fechConsulta = new Date();
                log.debug({ title: 'fecha de Consulta', details: fechConsulta });
                var idVendor = getSearchId(rfc, 'custentity_mx_rfc', search.Type.VENDOR);
                log.debug({ title: 'idVendor', details: idVendor });
                var idStatus = getSearchId(valorStatus, 'name', 'customrecord_efx_pp_sol_lco');
                log.debug({ title: 'idStatus', details: idStatus });

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

        // Busqueda dinamica para el ID del proveedor y estatus
        function getSearchId(valorFiltro, filtId, searchType) {
            try {
                var retStatus = '';
                var busquedaPvd = { name: "internalId" }
                var vendor_data_recordSearchObj = search.create({
                    type: searchType,
                    filters:
                        [
                            [filtId, search.Operator.IS, valorFiltro]
                        ],
                    columns:
                        [
                            search.createColumn(busquedaPvd)
                        ]
                });
                vendor_data_recordSearchObj.run().each(function (result) {
                    // log.debug({ title: 'result', details: result });
                    retStatus = result.getValue(busquedaPvd) || ' '
                    // log.debug({ title: 'retStatus', details: retStatus });
                });
                return retStatus;

            } catch (error) {
                log.error({ title: 'error getSearchId', details: error })
            }
        }

        return { execute }

    });
