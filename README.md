# Imagine Food

> COMP4471 final project

## Requirements

### Running notebooks

- [`python3`](https://www.python.org/) version 3.8+
- [`poetry`](https://python-poetry.org/) version 1.5+

### Building report

- [`latexmk`](https://mg.readthedocs.io/latexmk.html) version 4.76+

## Install

This project is built with poetry and can be installed with this command:

```shell
python3 -m pip install poetry
```

In order to install dependencies and create a virtual environment, just run:

```shell
poetry install
```

### Run in VSCode

In order to run notebooks with a virtual environment created by `poetry`, do the following:

1. Run `poetry env info`, fubd the `Executable: [PATH]` line in the output.
2. Create `.vscode/settings.json` file and add the following content there:

    ```json
    {
        "python.defaultInterpreterPath": "[PATH]"
    }
    ```

3. Open the notebook, click kernel icon -> `Select another kernel...` -> `Python environments...`, your virtual environment will be marked with a star, select it.

## Report

This template is modified from the template by [Ming-Ming Cheng](mailto:cmm_spam@nankai.edu.cn) from Nankai University, see also [website](https://github.com/MCG-NKU/CVPR_Template).
That version was again modified from the the old CVPR/ICCV template files contributed by [Paolo Ienne](mailto:Paolo.Ienne@di.epfl.ch) and [someone else](mailto:awf@acm.org).

The report is automatically built and released each and every time a tag is pushed to the GitHub repo.
It can also be built locally with the following command:

```shell
latexmk -pdf -file-line-error -halt-on-error -interaction=nonstopmode -output-directory=report report/report.tex
```
