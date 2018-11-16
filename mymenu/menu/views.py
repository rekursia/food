from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.http import Http404
from django.db.models import Q
from django.db import transaction

from rest_framework.authentication import SessionAuthentication, BasicAuthentication, TokenAuthentication
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import (AllowAny,
                                        IsAuthenticated)
from allauth.account.views import ConfirmEmailView
from allauth.account.views import app_settings


from menu.models import Category, Meal, Menu
from menu.serializers import CategorySerializer, \
    MealSerializer, MenuSerializer

from datetime import datetime

def index(request):
    if request.user.is_authenticated:
        return redirect('/menu/')

    context = {}
    return render(request, 'menu/index.html', context)

def user(request):
    if not request.user.is_authenticated:
        return redirect('/')

    context = {}
    return render(request, 'menu/user.html', context)

def menu(request):
    if not request.user.is_authenticated:
        return redirect('/')
    context = {}
    return render(request, 'menu/menu.html', context)

def book(request):
    if not request.user.is_authenticated:
        return redirect('/')
    context = {}
    return render(request, 'menu/book.html', context)

def failure(request, error):
    context = {'error': error}
    return render(request, 'menu/failure.html', context)

def get_categories_tree(categories_list):
    """
    Построение дерева категорий из списка всех категорий
    """
    tree = []
    for cat in categories_list:
        if not cat['parent_path']:
            tree.append({
                "id": cat['id'],
                "text": cat['name'],
                "is_deleted": cat['is_deleted'],
                "parent_path": cat['parent_path'],
                "children": []
            })
        else:
            parent_ids = [int(x) for x in cat['parent_path'].split('/')]
            p_tree = tree

            for id in parent_ids:
                for k in range(len(p_tree)):
                    if p_tree[k]['id'] == id:
                        p_tree = p_tree[k]['children']
                        break

            p_tree.append({
                "id": cat['id'],
                "text": cat['name'],
                "is_deleted": cat['is_deleted'],
                "parent_path": cat['parent_path'],
                "children": []
            })
    return tree

class CategoryList(APIView):
    """
    List all not deleted categories, or create a new category.
    """

    authentication_classes = (SessionAuthentication, BasicAuthentication, TokenAuthentication)
    permission_classes = (IsAuthenticated,)

    def get(self, request, category_id = None, format=None):
        user = User(pk=request.user.id)
        categories_queryset = Category.objects.filter(is_deleted=False, user=user)
        categories_queryset = categories_queryset.order_by('parent_path', 'name')
        categories_list = categories_queryset.all()

        serializer = CategorySerializer(categories_list, many=True)
        resp = Response(serializer.data)
        categories_tree = get_categories_tree(resp.data)

        return Response(categories_tree)

    def post(self, request, category_id = None, format=None):
        data = request.data.copy()
        data.pop('parent')
        parent = request.data['parent']
        if parent == '#':
            parent_category = None
            parent_path = ''
        else:
            parent_category = Category.objects.get(pk=parent)
            if parent_category.parent_path:
                parent_path = parent_category.parent_path + '/' + str(parent_category.id)
            else:
                parent_path = str(parent_category.id)
        user = User(pk=request.user.id)
        category = Category(parent=parent_category, user=user, parent_path=parent_path)
        serializer = CategorySerializer(category, data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoryAllList(APIView):
    """
        List all categories with deleted.
    """

    authentication_classes = (SessionAuthentication, BasicAuthentication, TokenAuthentication)
    permission_classes = (IsAuthenticated,)

    def get(self, request, category_id = None, format=None):
        user = User(pk=request.user.id)
        categories_queryset = Category.objects.filter(user=user).order_by('parent_path', 'name')
        categories_list = categories_queryset.all()

        serializer = CategorySerializer(categories_list, many=True)
        resp = Response(serializer.data)
        categories_tree = get_categories_tree(resp.data)

        return Response(categories_tree)

class CategoryDetail(APIView):
    """
    Retrieve, update or delete a category instance.
    """

    authentication_classes = (SessionAuthentication, TokenAuthentication, BasicAuthentication)
    permission_classes = (IsAuthenticated,)

    def get_object(self, request, category_id):

        try:
            user = User(pk=request.user.id)
            return Category.objects.get(pk=category_id, user=user)
        except Category.DoesNotExist:
            raise Http404

    def get_nested_objects(self, request, category):
        if category.parent_path:
            category_path = category.parent_path + '/' + str(category.id)
        else:
            category_path = str(category.id)

        user = User(pk=request.user.id)

        categories = Category.objects.filter(user=user).filter(
            Q(pk=category.id) | Q(parent_path=category_path) | Q(parent_path__startswith=category_path + '/'))

        return categories

    def get(self, request, category_id, format=None):
        category = self.get_object(request, category_id)
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, category_id, format=None):
        category = self.get_object(request, category_id)
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    #categoryes marked as "deleted"
    def delete(self, request, category_id, format=None):
        category = self.get_object(request, category_id)
        nested_categories = self.get_nested_objects(request, category)
        errors = {}

        data = {'is_deleted': True}
        try:
            with transaction.atomic():
                for cat in nested_categories:
                    serializer = CategorySerializer(cat, data=data, partial=True)
                    if serializer.is_valid():
                        serializer.save()
                        # meals in deleted category marked as "deleted"
                        meals = Meal.objects.filter(category=cat)
                        for meal in meals:
                            meal_serializer = MealSerializer(meal, data, partial=True)
                            if meal_serializer.is_valid():
                                meal_serializer.save()
                            else:
                                errors = meal_serializer.errors
                                raise Exception('Serialize errors')

                    else:
                        errors = serializer.errors
                        raise Exception('Serialize errors')
        except Exception as exc:
            if errors:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(str(exc), status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)


class MealList(APIView):
    """
    List all meals, or create a new meal.
    """
    authentication_classes = (SessionAuthentication, BasicAuthentication, TokenAuthentication)
    permission_classes = (IsAuthenticated,)

    def get(self, request, category_id, format=None):

        try:
            user = User(pk=request.user.id)
            category = Category.objects.get(pk=category_id)
            if not request.user.is_superuser and request.user.id != category.user.id:
                raise Category.DoesNotExist
        except Category.DoesNotExist:
            raise Http404

        meal_list = Meal.objects.filter(category=category, is_deleted=False).all()
        serializer = MealSerializer(meal_list, many=True)

        return Response(serializer.data)

    def post(self, request, category_id, format=None):
        try:
            category = Category.objects.get(pk=category_id, user=request.user)
        except Category.DoesNotExist:
            raise Http404
        meal = Meal(category=category)
        serializer = MealSerializer(meal, data=request.data)

        if serializer.is_valid():
             serializer.save()
             return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MealDetail(APIView):
    """
    Retrieve, update or delete a meal instance.
    """
    authentication_classes = (SessionAuthentication, BasicAuthentication, TokenAuthentication)
    permission_classes = (IsAuthenticated,)

    def get_object(self, request, meal_id):
        try:
            meal = Meal.objects.get(pk=meal_id)
            if not request.user.is_superuser and request.user.id != meal.category.user.id:
                raise Category.DoesNotExist
            return meal
        except Category.DoesNotExist:
            raise Http404
        except Meal.DoesNotExist:
            raise Http404

    def get(self, request, meal_id, format=None):
        meal = self.get_object(request, meal_id)
        serializer = MealSerializer(meal)

        return Response(serializer.data)

    def put(self, request, meal_id, format=None):
        meal = self.get_object(request, meal_id)
        serializer = MealSerializer(meal, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    #meals marked as "deleted"
    def delete(self, request, meal_id, format=None):
        meal = self.get_object(request, meal_id)
        data = {'is_deleted': True}
        serializer = MealSerializer(meal, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MenuList(APIView):
    """
    List all menu, or create a new menu.
    """
    authentication_classes = (SessionAuthentication, BasicAuthentication, TokenAuthentication)
    permission_classes = (IsAuthenticated,)

    def get(self, request, format=None):
        user = User(pk=request.user.id)
        menu_list = Menu.objects.filter(user=user, end_date__gte=datetime.now()).order_by('start_date')[:30]
        serializer = MenuSerializer(menu_list, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        data = request.data.copy()
        data['user_id'] = request.user.id
        serializer = MenuSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        #print('SE', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MenuDetail(APIView):
    """
    Retrieve, update or delete a meal instance.
    """
    authentication_classes = (SessionAuthentication, BasicAuthentication, TokenAuthentication)
    permission_classes = (IsAuthenticated,)

    def get_object(self, request, menu_id):
        try:
            user = User(pk=request.user.id)
            return Menu.objects.get(pk=menu_id, user=user)
        except Menu.DoesNotExist:
            raise Http404

    def get(self, request, menu_id, format=None):
        menu = self.get_object(request, menu_id)
        serializer = MenuSerializer(menu)

        return Response(serializer.data)

    def put(self, request, menu_id, format=None):
        menu = self.get_object(request, menu_id)
        serializer = MenuSerializer(menu, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def delete(self, request, menu_id, format=None):
        menu = self.get_object(request, menu_id)
        menu.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MenuConfirmEmailView(APIView, ConfirmEmailView):
    permission_classes = (AllowAny,)

    def get(self, *args, **kwargs):
        try:
            self.object = self.get_object()
            if app_settings.CONFIRM_EMAIL_ON_GET:
                return self.post(*args, **kwargs)
        except Http404:
            return redirect('/login/failure/incorrect-email-confirm/')
