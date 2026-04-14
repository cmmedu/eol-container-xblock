function StudioEditableXBlockMixin(runtime, element, settings) {
    "use strict";

    settings = settings || {};
    var fields = [];
    var tinyMceAvailable = (typeof $ !== 'undefined' && typeof $.fn.tinymce !== 'undefined');
    var datepickerAvailable = (typeof $ !== 'undefined' && typeof $.fn.datepicker !== 'undefined');
    var handlerUrl = runtime.handlerUrl(element, 'submit_studio_edits');

    $(element).find('.field-data-control').each(function () {
        var $field = $(this);
        var $wrapper = $field.closest('li');
        var $resetButton = $wrapper.find('button.setting-clear').not('.eolcontainer-cascade-row-btn');
        var type = $wrapper.data('cast');
        fields.push({
            name: $wrapper.data('field-name'),
            isSet: function () { return $wrapper.hasClass('is-set'); },
            hasEditor: function () { return tinyMceAvailable && $field.tinymce(); },
            val: function () {
                var val = $field.val();
                if (type === 'boolean') return (val === 'true' || val === '1');
                if (type === 'integer') return parseInt(val, 10);
                if (type === 'float') return parseFloat(val);
                if (type === 'generic' || type === 'list' || type === 'set') {
                    val = val.trim();
                    if (val === '') val = null;
                    else val = JSON.parse(val);
                }
                return val;
            },
            removeEditor: function () {
                if ($field.tinymce()) $field.tinymce().remove();
            }
        });
        var fieldChanged = function () {
            $wrapper.addClass('is-set');
            $resetButton.removeClass('inactive').addClass('active');
        };
        $field.on('change input paste', fieldChanged);
        $resetButton.on('click', function () {
            $field.val($wrapper.attr('data-default'));
            $wrapper.removeClass('is-set');
            $resetButton.removeClass('active').addClass('inactive');
        });
        if (type === 'html' && tinyMceAvailable && typeof baseUrl !== 'undefined') {
            tinyMCE.baseURL = baseUrl + '/js/vendor/tinymce/js/tinymce';
            $field.tinymce({
                theme: 'modern',
                skin: 'studio-tmce4',
                height: '200px',
                formats: { code: { inline: 'code' } },
                codemirror: { path: '' + baseUrl + '/js/vendor' },
                convert_urls: false,
                plugins: 'link codemirror',
                menubar: false,
                statusbar: false,
                toolbar_items_size: 'small',
                toolbar: 'formatselect | styleselect | bold italic underline forecolor wrapAsCode | bullist numlist outdent indent blockquote | link unlink | code',
                resize: 'both',
                extended_valid_elements: 'i[class],span[class]',
                setup: function (ed) { ed.on('change', fieldChanged); }
            });
        }
        if (type === 'datepicker' && datepickerAvailable) {
            $field.datepicker('destroy');
            $field.datepicker({ dateFormat: 'm/d/yy' });
        }
    });

    $(element).find('.wrapper-list-settings .list-set').each(function () {
        var $optionList = $(this);
        var $checkboxes = $(this).find('input');
        var $wrapper = $optionList.closest('li');
        var $resetButton = $wrapper.find('button.setting-clear');
        fields.push({
            name: $wrapper.data('field-name'),
            isSet: function () { return $wrapper.hasClass('is-set'); },
            hasEditor: function () { return false; },
            val: function () {
                var val = [];
                $checkboxes.each(function () {
                    if ($(this).is(':checked')) val.push(JSON.parse($(this).val()));
                });
                return val;
            }
        });
        var fieldChanged = function () {
            $wrapper.addClass('is-set');
            $resetButton.removeClass('inactive').addClass('active');
        };
        $checkboxes.on('change input', fieldChanged);
        $resetButton.on('click', function () {
            var defaults = JSON.parse($wrapper.attr('data-default'));
            $checkboxes.each(function () {
                var v = JSON.parse($(this).val());
                $(this).prop('checked', defaults.indexOf(v) > -1);
            });
            $wrapper.removeClass('is-set');
            $resetButton.removeClass('active').addClass('inactive');
        });
    });

    function studio_submit(data) {
        if ($.isFunction(runtime.notify)) runtime.notify('save', { state: 'start' });
        $.post(handlerUrl, JSON.stringify(data))
            .done(function () {
                if ($.isFunction(runtime.notify)) runtime.notify('save', { state: 'end' });
            })
            .fail(function () {
                if ($.isFunction(runtime.notify)) {
                    runtime.notify('error', {
                        title: 'Error al guardar en el xblock',
                        message: 'No se pudo guardar la configuración del xblock.',
                    });
                    runtime.notify('save', { state: 'end' });
                }
            });
    }

    $('.save-button', element).on('click', function (e) {
        e.preventDefault();
        var values = {};
        var notSet = [];
        for (var i in fields) {
            var field = fields[i];
            if (field.isSet()) {
                values[field.name] = field.val();
            } else {
                notSet.push(field.name);
            }
            if (field.hasEditor && field.hasEditor()) field.removeEditor();
        }
        studio_submit({ values: values, defaults: notSet });
    });

    $(element).find('.cancel-button').on('click', function (e) {
        for (var i in fields) {
            var f = fields[i];
            if (f.hasEditor && f.hasEditor()) f.removeEditor();
        }
        e.preventDefault();
        runtime.notify('cancel', {});
    });

     // Llenar desplegables
     let order = Array.isArray(settings.capsule_order) ? settings.capsule_order : [];
     let $proyecto = $(element).find('#eolcontainer-proyecto');
     if ($proyecto.length) {
         let $subproyecto = $(element).find('#eolcontainer-subproyecto');
         let $tipo = $(element).find('#eolcontainer-tipo');
         let $clearProyecto = $(element).find('#eolcontainer-clear-proyecto');
         let $clearSubproyecto = $(element).find('#eolcontainer-clear-subproyecto');
         let $clearTipoSelect = $(element).find('#eolcontainer-clear-tipo-select');
         let $typeInput = $(element).find('#xb-field-edit-type');
         let $typeWrapper = $typeInput.closest('li');
         let $typeFieldReset = $typeWrapper.find('.eolcontainer-type-input-reset');
         let defaultOptionLabel = '-- Seleccionar --';
 
         function resetSelect($select) {
             $select.empty().append(
                 $('<option></option>').val('').text(defaultOptionLabel)
             );
         }


         function collectAllTiposUnique() {
             let seen = {};
             let out = [];
             for (var pi = 0; pi < order.length; pi++) {
                 let sub = order[pi].subproyecto || {};
                 for (var sk in sub) {
                     if (!sub.hasOwnProperty(sk)) continue;
                     let arr = sub[sk];
                     for (var ti = 0; ti < arr.length; ti++) {
                         let name = arr[ti];
                         if (!seen[name]) {
                             seen[name] = true;
                             out.push(name);
                         }
                     }
                 }
             }
             return out;
         }

        // Todos los tipos de un proyecto
         function collectTiposForProject(projIndex) {
             var seen = {};
             var out = [];
             var sub = order[projIndex] && order[projIndex].subproyecto;
             if (!sub) return out;
             for (var sk in sub) {
                 if (!sub.hasOwnProperty(sk)) continue;
                 var arr = sub[sk];
                 for (var ti = 0; ti < arr.length; ti++) {
                     var name = arr[ti];
                     if (!seen[name]) {
                         seen[name] = true;
                         out.push(name);
                     }
                 }
             }
             return out;
         }

         function populateTipoOptions(tipos) {
             resetSelect($tipo);
             for (var t = 0; t < tipos.length; t++) {
                 $tipo.append(
                     $('<option></option>').val(tipos[t]).text(tipos[t])
                 );
             }
         }

         function fillTipoAll() {
             populateTipoOptions( allContainerTypes );
         }

         function fillTipoForProject(projIndex) {
             populateTipoOptions(collectTiposForProject(projIndex));
         }
 
         function fillProyecto() {
             resetSelect($proyecto);
             for (let i = 0; i < order.length; i++) {
                 $proyecto.append(
                     $('<option></option>').val(String(i)).text(order[i].proyecto)
                 );
             }
             resetSelect($subproyecto);
             fillTipoAll();
         }
 
         function fillSubproyecto(projIndex) {
             resetSelect($subproyecto);
             let sub = order[projIndex] && order[projIndex].subproyecto;
             let subKeys = [];
             if (sub) {
                 for (let key in sub) {
                     if (sub.hasOwnProperty(key)) {
                         subKeys.push(key);
                         $subproyecto.append(
                             $('<option></option>').val(key).text(key)
                         );
                     }
                 }
             }
             if (subKeys.length === 1) {
                 $subproyecto.val(subKeys[0]);
                 fillTipo(projIndex, subKeys[0]);
             } else {
                 fillTipoForProject(projIndex);
             }
         }
 
         function fillTipo(projIndex, subKey) {
             resetSelect($tipo);
             var tipos = order[projIndex] && order[projIndex].subproyecto && order[projIndex].subproyecto[subKey];
             if (tipos) {
                 for (var t = 0; t < tipos.length; t++) {
                     $tipo.append(
                         $('<option></option>').val(tipos[t]).text(tipos[t])
                     );
                 }
             }
         }
 
         function resetAllCascadeSelects() {
             $proyecto.val('');
             resetSelect($subproyecto);
             fillTipoAll();
             $tipo.val('');
         }

         function clearSubproyectoOnly() {
             var idx = $proyecto.val();
             $subproyecto.val('');
             if (idx === '') {
                 resetSelect($subproyecto);
                 fillTipoAll();
             } else {
                 fillTipoForProject(parseInt(idx, 10));
             }
             $tipo.val('');
         }

         function setTypeFromSelect() {
             var v = $tipo.val();
             if (v) {
                 $typeInput.val(v);
                 $typeWrapper.addClass('is-set');
                 $typeFieldReset.removeClass('inactive').addClass('active');
             }
         }
 
         function preselectFromTypeValue() {
             var current = ($typeInput.val() || '').trim();
             if (!current) return;
             for (var i = 0; i < order.length; i++) {
                 var sub = order[i].subproyecto || {};
                 for (var key in sub) {
                     if (sub.hasOwnProperty(key) && sub[key].indexOf(current) !== -1) {
                         $proyecto.val(String(i));
                         fillSubproyecto(i);
                         $subproyecto.val(key);
                         fillTipo(i, key);
                         $tipo.val(current);
                         return;
                     }
                 }
             }
         }

        let allContainerTypes = collectAllTiposUnique();
 
         fillProyecto();
         preselectFromTypeValue();

         $typeFieldReset.on('click', function () {
             resetAllCascadeSelects();
         });

         $clearProyecto.on('click', function (e) {
             e.preventDefault();
             resetAllCascadeSelects();
         });
         $clearSubproyecto.on('click', function (e) {
             e.preventDefault();
             clearSubproyectoOnly();
         });
         $clearTipoSelect.on('click', function (e) {
             e.preventDefault();
             $tipo.val('');
         });
 
         $proyecto.on('change', function() {
             var idx = $(this).val();
             if (idx === '') {
                 resetSelect($subproyecto);
                 fillTipoAll();
             } else {
                 fillSubproyecto(parseInt(idx, 10));
             }
         });
         $subproyecto.on('change', function() {
             var idx = $proyecto.val();
             var key = $(this).val();
             if (idx === '') {
                 fillTipoAll();
             } else if (key === '') {
                 fillTipoForProject(parseInt(idx, 10));
             } else {
                 fillTipo(parseInt(idx, 10), key);
             }
         });
         $tipo.on('change', setTypeFromSelect);
    }
}