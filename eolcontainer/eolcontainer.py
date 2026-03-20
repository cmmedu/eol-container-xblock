import json
import pkg_resources

from django.template import Context, Template

from xblock.core import XBlock
from xblock.fields import Integer, Scope, String, Boolean
from xblock.fragment import Fragment
from xblockutils.studio_editable import StudioEditableXBlockMixin

# Make '_' a no-op so we can scrape strings
_ = lambda text: text


class EolContainerXBlock(StudioEditableXBlockMixin, XBlock):

    display_name = String(
        display_name=_("Display Name"),
        help=_("Display name for this module"),
        default="Eol Container XBlock",
        scope=Scope.settings,
    )

    icon_class = String(
        default="other",
        scope=Scope.settings,
    )

    # TYPE (text field: author can type/paste or use the 3 cascading selects in Studio to fill it)
    type = String(
        display_name=_("Tipo de cápsula"),
        help=_("Escriba o pegue el tipo, o use los desplegables abajo para seleccionarlo."),
        default="Exploremos",
        scope=Scope.settings,
    )

    # Text
    text = String(
        display_name=_("Contenido de Capsula"), 
        multiline_editor='html', 
        resettable_editor=False,
        default=_("<p>Contenido de la capsula.</p>"), 
        scope=Scope.settings,
        help=_("Indica el contenido de la capsula")
    )

    # Case Title
    case_title = String(
        display_name=_("Titulo del Caso"),
        help=_("(Solo capsula CASO) Titulo que aparece arriba del caso"),
        default="Caso",
        scope=Scope.settings,
    )

    show_header = Boolean(
        display_name=_('Mostrar Header'),
        help=_(
            '(Solo capsula CASO) Si se muestra o no el header'
        ),
        default=True,
        scope=Scope.settings,
    )

    show_footer = Boolean(
        display_name=_('Mostrar Footer'),
        help=_(
            '(Solo capsula CASO) Si se muestra o no el footer'
        ),
        default=True,
        scope=Scope.settings,
    )

    responsive = Boolean(
        display_name=_('Ancho de columna completo (Responsive)'),
        help=_(
                'Expande el tamaño de la cápsula al 100% de la columna.'
            ),
        default=False,
        scope=Scope.settings,
    )

    #Generic Container Fields
    background_color_header = String(
        display_name=_("Color Fondo Header"),
        help=_("(Solo capsula GENERICA) Color de fondo del header en capsula generica"),
        default="#2B9580",
        scope=Scope.settings,
    )

    background_color_icon = String(
        display_name=_("Color Fondo Icono"),
        help=_("(Solo capsula GENERICA) Color de fondo del icono en capsula generica"),
        default="#BBE8FC",
        scope=Scope.settings,
    )

    border_color = String(
        display_name=_("Color Borde"),
        help=_("(Solo capsula GENERICA) Color borde de capsula"),
        default="#52A998",
        scope=Scope.settings,
    )


    # ICON
    ainicon = String(
        display_name = _("Icono"),
        help = _("(Solo capsula Animalito) seleccione el animal de esta capsula"),
        default = "Puma",
        values = ["Puma","Zorro", "Monito"
                  ],
        scope = Scope.settings
    )

    icon_url = String(
        display_name=_("Icono"),
        help=_("(Solo capsulas GENERICA y ANIMALITO-SP) url imagen del icono"),
        default="https://static.sumaysigue.uchile.cl/Didactica/produccion/assets/img/book.png",
        scope=Scope.settings,
    )

    editable_fields = ('type', 'text', 'case_title', 'show_header', 'show_footer', 'responsive', 'background_color_header', 'background_color_icon', 'border_color', 'icon_url')

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def student_view(self, context=None):
        context_html = self.get_context()
        template = self.render_template('static/html/eolcontainer.html', context_html)
        frag = Fragment(template)
        frag.add_css(self.resource_string("static/css/eolcontainer.css"))
        frag.add_javascript(self.resource_string("static/js/src/eolcontainer.js"))
        settings = {
            'location'  : str(self.location).split('@')[-1],
            'type'      : self.type
        }
        frag.initialize_js('EolContainerXBlock', json_args=settings)
        return frag

    def get_context(self):
        return {
            'xblock': self,
            'location': str(self.location).split('@')[-1]
        }

    def studio_view(self, context=None):
        """Studio editor: type is a text field; 3 cascading selects only overwrite it."""
        from xblock.fields import Scope
        context = {'fields': []}
        for field_name in self.editable_fields:
            field = self.fields[field_name]
            if field.scope not in (Scope.content, Scope.settings):
                continue
            field_info = self._make_field_info(field_name, field)
            if field_info is not None:
                context["fields"].append(field_info)
        order_json = self.resource_string("static/json/order.json")
        capsule_order = json.loads(order_json)
        template = self.render_template('static/html/studio_edit.html', context)
        frag = Fragment(template)
        frag.add_javascript(self.resource_string("static/js/src/studio_edit.js"))
        frag.initialize_js(
            'StudioEditableXBlockMixin',
            json_args={'capsule_order': capsule_order},
        )
        return frag

    def render_template(self, template_path, context):
        template_str = self.resource_string(template_path)
        template = Template(template_str)
        return template.render(Context(context))

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("EolContainerXBlock",
             """<eolcontainer/>
             """),
            ("Multiple EolContainerXBlock",
             """<vertical_demo>
                <eolcontainer
                    type="Observacion-M24"
                />
                <eolcontainer
                    type="Exploremos-Media"
                />
                <eolcontainer
                    type="Problema-Media"
                />
                <eolcontainer
                    type="Reflexionemos"
                />
                <eolcontainer
                    type="Pedagogica-Media"
                />
                <eolcontainer
                    type="Caso-Media"
                    show_footer="True"
                    show_header="True"
                    case_title="Un caso de prueba"
                />
                <eolcontainer
                    type="Instruccion-Media"
                />
                <eolcontainer
                    type="Observacion-Media"
                />
                <eolcontainer
                    type="Objetivos-Media"
                />
                <eolcontainer
                    type="Video-Media"
                />
                <eolcontainer
                    type="Disciplinar-Media"
                />
                <eolcontainer
                    type="Respuesta"
                />
                </vertical_demo>
                <eolcontainer
                    type="Caso-RedFid"
                    show_footer="True"
                    show_header="False"
                    case_title="Un caso de prueba"
                />
                <eolcontainer
                    type="Exploremos-RedFid"
                />
                <eolcontainer
                    type="Observacion-RedFid"
                />
                <eolcontainer
                    type="Lenguaje-RedFid"
                />
                <eolcontainer
                    type="Instruccion-RedFid"
                />
                <eolcontainer
                    type="Situacion-RedFid"
                />
                <eolcontainer
                    type="Video-RedFid"
                />
                <eolcontainer
                    responsive="True"
                    case_title="Prueba responsive"
                />
             """),
        ]
    