from django.template import context as template_context


def _patch_django_template_context_copy():
    """Compatibility shim for Python 3.14 + Django 4.2 template context copies."""
    base = template_context.BaseContext

    def __copy__(self):
        duplicate = self.__class__.__new__(self.__class__)
        duplicate.__dict__ = self.__dict__.copy()
        duplicate.dicts = self.dicts[:]
        return duplicate

    if getattr(base.__copy__, "__module__", "") != __name__:
        base.__copy__ = __copy__


_patch_django_template_context_copy()
