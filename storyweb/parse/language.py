from functools import cache
from typing import Optional
import fasttext
import languagecodes
from normality import collapse_spaces
from pathlib import Path

model_path = Path(__file__).parent / "lid.176.ftz"


@cache
def get_model():
    try:
        # see https://github.com/facebookresearch/fastText/issues/1056
        fasttext.FastText.eprint = lambda *args, **kwargs: None
    except:
        pass
    return fasttext.load_model(model_path.as_posix())


def detect_language(text: Optional[str]) -> Optional[str]:
    model = get_model()
    text = collapse_spaces(text)
    if text is None:
        return text
    out = model.predict(text[:10000])
    if not len(out):
        return None
    ((lang,), _) = out
    lang = lang.replace("__label__", "")
    lang_long = languagecodes.iso_639_alpha3(lang)
    if lang_long is not None:
        return lang_long
    return None
