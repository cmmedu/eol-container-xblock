import pkg_resources

from django.template import Context, Template

from xblock.core import XBlock
from xblock.fields import Integer, Scope, String
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

    # TYPE
    type = String(
        display_name = _("Tipo"),
        help = _("Selecciona el tipo de capsula"),
        default = "Exploremos",
        values = ["Contenido", "Observacion", "Exploremos", "Instruccion", "Respuesta"],
        scope = Scope.settings
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

    editable_fields = ('type', 'text')

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

    def render_template(self, template_path, context):
        template_str = self.resource_string(template_path)
        template = Template(template_str)
        return template.render(Context(context))
    