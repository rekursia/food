# -*- coding: utf-8 -*-

from django.db import models
from django.core.validators import MinLengthValidator, RegexValidator


class Category(models.Model):
    name = models.CharField(max_length=50, validators=[
            MinLengthValidator(2, 'Minimal length for name is 2 symbols'),
            RegexValidator(r'^[\wА-Яа-я ]*$', 'Only alphanumeric characters are allowed.')
        ])
    parent = models.ForeignKey('self', blank=True, null=True, verbose_name="Родитель", related_name='child',on_delete=models.CASCADE)
    parent_path = models.CharField(max_length=255, default='')
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='categories')
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return self.name + ' ----- ' + str(self.id)


class Meal(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    name = models.CharField(max_length=50, validators=[
            MinLengthValidator(2, 'Minimal length for name is 2 symbols'),
            RegexValidator(r'^[\wА-Яа-я ]*$', 'Only alphanumeric characters are allowed.')
        ])
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return str(self.id) + ' || ' + self.name + ' || ' + str(self.category.id)


class Menu(models.Model):
    start_date = models.DateField()
    end_date = models.DateField()
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    meals = models.ManyToManyField('Meal')

    def __str__(self):
        return "%s -- %s" % (self.start_date, self.end_date)
