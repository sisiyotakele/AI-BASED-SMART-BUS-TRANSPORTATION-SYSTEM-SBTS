from app.features.pipeline import build_features

def test_pipeline():
    assert build_features({'a':1}) == {'a':1}

