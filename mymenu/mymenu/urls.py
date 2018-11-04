from django.conf.urls import url, include
from django.urls import path
from django.contrib import admin
from django.views.generic import TemplateView

from rest_framework.urlpatterns import format_suffix_patterns
from rest_framework_jwt.views import refresh_jwt_token

from menu import views

api_urlpatterns = [
    path('book/categories/all/', views.CategoryAllList.as_view()),
    path('book/categories/', views.CategoryList.as_view()),
    path('book/categories/<category_id>/', views.CategoryList.as_view()),
    path('book/category/<category_id>/', views.CategoryDetail.as_view()),

    path('book/categories/<category_id>/meals/', views.MealList.as_view()),
    path('book/meal/<meal_id>/', views.MealDetail.as_view()),

    path('menu/list/', views.MenuList.as_view()),
    path('menu/<menu_id>/', views.MenuDetail.as_view()),

]
api_urlpatterns = format_suffix_patterns(api_urlpatterns)

rest_auth_urlpatterns = [
    url(r'^rest-auth/registration/account-email-verification-sent/',
        TemplateView.as_view(), name='account_email_verification_sent'),

    url(r'^rest-auth/registration/account-confirm-email/(?P<key>[-:\w]+)/$',
        views.MenuConfirmEmailView.as_view(), name='account_confirm_email'),

    url(r'^rest-auth/password-reset/confirm/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
        TemplateView.as_view(template_name="menu/password_reset_confirm.html"), name='password_reset_confirm'),

    url(r'^rest-auth/', include('rest_auth.urls')),
    url(r'^rest-auth/registration/', include('rest_auth.registration.urls')),
    url(r'^refresh-token/', refresh_jwt_token),
]

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    url(r'^$', views.index, name='index'),
    #profile
    url(r'^user/$', views.user, name='user'),
    #autorization errors
    url(r'^login/failure/(?P<error>[-:\w]+)/', views.failure, name='failure'),
    #main urls
    url(r'^menu/', include('menu.urls', namespace='menu')),

    # API:V1 urls
    url(r'^api/v1/', include(api_urlpatterns)),

    url(r'^admin/', admin.site.urls),


]

urlpatterns += rest_auth_urlpatterns
