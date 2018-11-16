# Generated by Django 2.1.2 on 2018-11-16 06:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0004_auto_20181101_0826'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='menumeals',
            unique_together=set(),
        ),
        migrations.RemoveField(
            model_name='menumeals',
            name='meal',
        ),
        migrations.RemoveField(
            model_name='menumeals',
            name='menu',
        ),
        migrations.AddField(
            model_name='menu',
            name='meals',
            field=models.ManyToManyField(related_name='meals', to='menu.Meal'),
        ),
        migrations.DeleteModel(
            name='MenuMeals',
        ),
    ]