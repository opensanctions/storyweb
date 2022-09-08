from setuptools import setup, find_packages

with open("README.md") as f:
    long_description = f.read()


setup(
    name="storyweb",
    version="0.0.1",
    description="Extract actor networks from journalistic reporting.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    keywords="ner spacy journalism text nlp graph entities",
    author="Friedrich Lindenberg",
    author_email="friedrich@pudo.org",
    url="https://github.com/opensanctions/storyweb",
    license="MIT",
    packages=find_packages(exclude=["ez_setup", "examples", "tests"]),
    namespace_packages=[],
    include_package_data=True,
    package_data={"": ["storyweb/py.typed"]},
    zip_safe=False,
    install_requires=[
        "sqlalchemy[asyncio]",
        "aiosqlite",
        "aiohttp[speedups]",
        "asyncpg",
        "pydantic",
        "pydantic_yaml",
        "articledata",
        "pantomime",
        "shortuuid >= 1.0.1, < 2.0.0",
        "click >= 8.0.0, < 8.1.0",
    ],
    tests_require=[],
    entry_points={
        "console_scripts": [
            "storyweb = storyweb.cli:cli",
        ],
    },
    extras_require={
        "dev": [
            "wheel>=0.29.0",
            "twine",
            "mypy",
            "flake8>=2.6.0",
            "pytest",
            "pytest-cov",
            "coverage>=4.1",
            "types-setuptools",
            "types-requests",
        ],
    },
)
