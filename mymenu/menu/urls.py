# -*- coding: utf-8 -*-

from django.conf.urls import url
from . import views

app_name = 'menu'

urlpatterns = [
    url(r'^$', views.menu, name='index'),
    #menu
    #url(r'^$', views.menu, name='menu'),
    # ex: /book/
    url(r'^book/$', views.book, name='book'),
]