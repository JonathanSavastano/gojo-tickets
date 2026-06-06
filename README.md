each time you open a terminal to work on this project make sure to activate the venv
``` venv\Scripts\activate ```

when using pip install, after installing new packages can use 
``` pip freeze > requirements.txt  ```

And then to recreate venv exactly:
``` pip install -r requirements.txt ``` 

This starts the API
``` uvicorn app.main:app --reload ```
uvicorn - web server
app.main - python module path, it means "look in the app folder, find main.py"
:app - after the colon, this refers to the specific variable inside main.py ( app = FastAPI() )
--reload - tells uvicorn to watch files and auto restart when you save changes