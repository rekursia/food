from django.contrib.auth.models import User, Group
from django.db import transaction

from rest_framework import serializers

from menu.models import Category, Meal, Menu, MenuMeals

from datetime import datetime


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'groups')


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ('url', 'name')

class CategorySerializer(serializers.ModelSerializer):
    #user = UserSerializer(read_only=True)
    #meals = MealSerializer(many=True, read_only=True)
    #lookup_field = 'category_id'
    class Meta:
        model = Category
        fields = ('id', 'name', 'parent_path', 'is_deleted')

class MealSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Meal
        fields = ('id', 'name', 'is_deleted','category')


class MenuMealsSerializer(serializers.ModelSerializer):
    meal = MealSerializer(read_only=True)
    class Meta:
        model = MenuMeals
        fields = ('meal_id','menu_id','meal')

class MenuSerializer(serializers.ModelSerializer):

    def to_representation(self, obj):
        rep = super(MenuSerializer, self).to_representation(obj)
        meals = []
        for x in rep.get('meals'):
            m = x['meal']
            meals.append({
                'id': m['id'],
                'name': m['name'],
                'category_id': m['category']['id'], #TODO: исправить на category
                'category': m['category'],
            })
        rep['meals'] = meals
        # Does the diapason include current date ?
        rep['current_date']  = obj.start_date <= datetime.now().date() <= obj.end_date
        return rep

    def to_internal_value(self, data):
        menu_data = super(MenuSerializer, self).to_internal_value(data)
        menu_data['meals_ids'] = data.getlist('meals_ids[]')
        menu_data['user_id'] = data.get('user_id')

        return menu_data

    def validate(self, data):
        """
        Check that the date is correct.
        """
        id = self.initial_data.get('id', None)

        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("finish must occur after start")

        if not id and Menu.objects.filter(
            start_date__lte=data['end_date'],
            end_date__gte=data['start_date'],
            user_id=data['user_id']
        ).exists():
            raise serializers.ValidationError("There is a menu on these dates")
        elif id and Menu.objects.filter(
                start_date__lte=data['end_date'],
                end_date__gte=data['start_date'],
                user_id=data['user_id']
            ).exclude(id=id).exists():
                raise serializers.ValidationError("There is a menu on these dates")
        return data

    def update(self, instance, validated_data):

        instance.start_date = validated_data.get('start_date', instance.start_date)
        instance.end_date = validated_data.get('end_date', instance.end_date)

        try:
            with transaction.atomic():
                MenuMeals.objects.filter(menu=instance).delete()
                for meal_id in validated_data.get('meals_ids',[]):
                    meal = Meal.objects.get(id=meal_id)
                    MenuMeals.objects.create(menu=instance, meal=meal)
                instance.save()

            return instance
        except Exception as exc:
            raise serializers.ValidationError({"non_field_errors":[str(exc)]})


    def create(self, validated_data):

        try:
            with transaction.atomic():
                instance = Menu(start_date=validated_data['start_date'], end_date=validated_data['end_date'],
                                user_id=validated_data['user_id'])
                instance.save()

                for meal_id in validated_data.get('meals_ids', []):
                    meal = Meal.objects.get(id=meal_id)
                    MenuMeals.objects.create(menu=instance, meal=meal)

                return instance

        except Exception as exc:
            raise serializers.ValidationError({"non_field_errors":[str(exc)]})



    meals = MenuMealsSerializer(many=True, read_only=True)
    start_date = serializers.DateField(format="%d.%m.%Y", input_formats=['%d.%m.%Y', 'iso-8601'])
    end_date = serializers.DateField(format="%d.%m.%Y", input_formats=['%d.%m.%Y', 'iso-8601'])

    class Meta:
        model = Menu
        fields = ('id','start_date', 'end_date','meals','user_id')

