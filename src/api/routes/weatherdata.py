import configparser
from logging import exception
from fastapi import APIRouter
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import true
from schemas.index import Getweather,Returnweather
from db.database import get_db
from models.index import Weather
from itertools import groupby
from fastapi_pagination import LimitOffsetPage, Page, add_pagination,paginate
import itertools
from operator import itemgetter
import json
import decimal, datetime


from pydantic import BaseModel


weather= APIRouter()

@weather.post('/getweather', status_code=200)
async def get_weathertrend(details:Getweather,db:Session=Depends(get_db)):
    try:
        query="SELECT DISTINCT extract(epoch from data_date)*1000 as unix,"+details.parameter+"::FLOAT FROM tbl_weather WHERE data_date BETWEEN '"+details.start_date+"' AND '"+details.end_date+"' AND district='"+details.district+"' AND mandal='"+details.mandal+"'"
        data=db.execute(query)
        results = [list(row) for row in data]
        db.close()
        return{
            'code':200,
            'trend':results
        }
    except:
        return{
            "message":"Error occured please provide valid parameters"
        }
@weather.post('/getweathertabular', status_code=200)
async def get_weathertrend(details:Getweather,db:Session=Depends(get_db)):
    try:
        query="SELECT data_date,"+details.parameter+"::FLOAT FROM tbl_weather WHERE data_date BETWEEN '"+details.start_date+"' AND '"+details.end_date+"' AND district='"+details.district+"' AND mandal='"+details.mandal+"'"
        data=db.execute(query)
        results = [list(row) for row in data]
        db.close()
        return{
            'code':200,
            'trend':results
        }
    except:
        return{
            "message":"Error occured please provide valid parameters"
        }
@weather.get('/weatherparameter',status_code=200)
async def get_weather_parameter():
    return{
        'code':200,
        'parameters':[
            {
                'parameter':'rain',
                'unit':'mm'
            },
            {
                'parameter':'min_temp',
                'unit':'°C'
            },
            {
                'parameter':'max_temp',
                'unit':'°C'
            },
            {
                'parameter':'min_humidity',
                'unit':'%'
            },
            {
                'parameter':'max_humidity',
                'unit':'%'
            },
            {
                'parameter':'min_wind_speed',
                'unit':'kmph'
            },
            {
                'parameter':'max_wind_speed',
                'unit':'kmph'
            },
            
        ]
    }
    