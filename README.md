# Imagine Food

> COMP4471 final project

## Install

This project is built with [poetry](https://python-poetry.org/).
It can be installed with this command: `python3 -m pip install poetry`.
In order to install dependencies and create a virtual environment, just run `poetry install`.

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
