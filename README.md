# OOD Jupyter
OOD interactive app that launches a Jupyter Notebook / Lab server.
Basic functionality consists of launching Jupyter with Python from one of the modules available.
Advanced functionality allows creating or using virtual environments based on the modules and configuring the user packages path.

The app requires ood-util and ood-initializers to work.

## Virtual environments

The virtual environments work so that the user provides a path to a directory that they want to use for the venv.
If the directory already exists and is a venv that venv will be activated and Jupyter launched.
If it does not exist we create a new venv in that directory using the module specified by the user.
The virtual environments in this app are not really true standalone environments, they are in practice venvs with `--system-site-packages` enabled.
This is due to the Python environments in Singularity containers causing issues with venv.

## User packages

As Python by default installs user packages in the home directory, which we want to avoid, we provide an option to disable them and also customize the path.

