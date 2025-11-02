from setuptools import setup, find_packages

setup(
    name='bookparser',
    version='0.0.1',
    packages=find_packages(),
    install_requires=["typer"],
    entry_points={"console_scripts": ["bookparser=main_package.cli.parser_cli:app"]},
)