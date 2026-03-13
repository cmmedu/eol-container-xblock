/* Studio editor for Eol Container: type = text field; 3 cascading selects overwrite it. */
function StudioEditableXBlockMixin(runtime, element) {
    "use strict";

    var fields = [];
    var tinyMceAvailable = (typeof $ !== 'undefined' && typeof $.fn.tinymce !== 'undefined');
    var datepickerAvailable = (typeof $ !== 'undefined' && typeof $.fn.datepicker !== 'undefined');
    var handlerUrl = runtime.handlerUrl(element, 'submit_studio_edits');

    $(element).find('.field-data-control').each(function() {
        var $field = $(this);
        var $wrapper = $field.closest('li');
        var $resetButton = $wrapper.find('button.setting-clear');
        var type = $wrapper.data('cast');
        fields.push({
            name: $wrapper.data('field-name'),
            isSet: function() { return $wrapper.hasClass('is-set'); },
            hasEditor: function() { return tinyMceAvailable && $field.tinymce(); },
            val: function() {
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
            removeEditor: function() {
                if ($field.tinymce()) $field.tinymce().remove();
            }
        });
        var fieldChanged = function() {
            $wrapper.addClass('is-set');
            $resetButton.removeClass('inactive').addClass('active');
        };
        $field.on('change input paste', fieldChanged);
        $resetButton.on('click', function() {
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
                setup: function(ed) { ed.on('change', fieldChanged); }
            });
        }
        if (type === 'datepicker' && datepickerAvailable) {
            $field.datepicker('destroy');
            $field.datepicker({ dateFormat: 'm/d/yy' });
        }
    });

    $(element).find('.wrapper-list-settings .list-set').each(function() {
        var $optionList = $(this);
        var $checkboxes = $(this).find('input');
        var $wrapper = $optionList.closest('li');
        var $resetButton = $wrapper.find('button.setting-clear');
        fields.push({
            name: $wrapper.data('field-name'),
            isSet: function() { return $wrapper.hasClass('is-set'); },
            hasEditor: function() { return false; },
            val: function() {
                var val = [];
                $checkboxes.each(function() {
                    if ($(this).is(':checked')) val.push(JSON.parse($(this).val()));
                });
                return val;
            }
        });
        var fieldChanged = function() {
            $wrapper.addClass('is-set');
            $resetButton.removeClass('inactive').addClass('active');
        };
        $checkboxes.on('change input', fieldChanged);
        $resetButton.on('click', function() {
            var defaults = JSON.parse($wrapper.attr('data-default'));
            $checkboxes.each(function() {
                var v = JSON.parse($(this).val());
                $(this).prop('checked', defaults.indexOf(v) > -1);
            });
            $wrapper.removeClass('is-set');
            $resetButton.removeClass('active').addClass('inactive');
        });
    });

    function studio_submit(data) {
        if ($.isFunction(runtime.notify)) runtime.notify('save', { state: 'start' });
        $.post(handlerUrl, JSON.stringify(data)).done(function() {
            if ($.isFunction(runtime.notify)) runtime.notify('save', { state: 'end' });
        });
    }

    $('.save-button', element).on('click', function(e) {
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

    $(element).find('.cancel-button').on('click', function(e) {
        for (var i in fields) {
            var f = fields[i];
            if (f.hasEditor && f.hasEditor()) f.removeEditor();
        }
        e.preventDefault();
        runtime.notify('cancel', {});
    });

    // --- 3 cascading selects: overwrite the type text field ---
    var $orderEl = $(element).find('#eolcontainer-capsule-order');
    if ($orderEl.length) {
        var order = [];
        try {
            order = JSON.parse($orderEl.text());
        } catch (err) {
            order = [];
        }
        var $proyecto = $(element).find('#eolcontainer-proyecto');
        var $subproyecto = $(element).find('#eolcontainer-subproyecto');
        var $tipo = $(element).find('#eolcontainer-tipo');
        var $typeInput = $(element).find('#xb-field-edit-type');
        var $typeWrapper = $typeInput.closest('li');
        var $typeReset = $typeWrapper.find('button.setting-clear');

        function fillProyecto() {
            var opts = ['<option value="">-- Seleccionar --</option>'];
            for (var i = 0; i < order.length; i++) {
                opts.push('<option value="' + i + '">' + order[i].proyecto + '</option>');
            }
            $proyecto.html(opts.join(''));
            $subproyecto.html('<option value="">-- Seleccionar --</option>');
            $tipo.html('<option value="">-- Seleccionar --</option>');
        }

        function fillSubproyecto(projIndex) {
            var opts = ['<option value="">-- Seleccionar --</option>'];
            var sub = order[projIndex] && order[projIndex].subproyecto;
            if (sub) {
                for (var key in sub) {
                    if (sub.hasOwnProperty(key)) {
                        opts.push('<option value="' + key + '">' + key + '</option>');
                    }
                }
            }
            $subproyecto.html(opts.join(''));
            $tipo.html('<option value="">-- Seleccionar --</option>');
        }

        function fillTipo(projIndex, subKey) {
            var opts = ['<option value="">-- Seleccionar --</option>'];
            var tipos = order[projIndex] && order[projIndex].subproyecto && order[projIndex].subproyecto[subKey];
            if (tipos) {
                for (var t = 0; t < tipos.length; t++) {
                    opts.push('<option value="' + tipos[t] + '">' + tipos[t] + '</option>');
                }
            }
            $tipo.html(opts.join(''));
        }

        function setTypeFromSelect() {
            var v = $tipo.val();
            if (v) {
                $typeInput.val(v);
                $typeWrapper.addClass('is-set');
                $typeReset.removeClass('inactive').addClass('active');
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

        fillProyecto();
        preselectFromTypeValue();

        $proyecto.on('change', function() {
            var idx = $(this).val();
            if (idx !== '') fillSubproyecto(parseInt(idx, 10));
        });
        $subproyecto.on('change', function() {
            var idx = $proyecto.val();
            var key = $(this).val();
            if (idx !== '' && key !== '') fillTipo(parseInt(idx, 10), key);
        });
        $tipo.on('change', setTypeFromSelect);
    }
}
