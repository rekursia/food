
MenuApp.menu = {};
(function(scope) {
    var _choisenDates = {
        start_date: null,
        end_date: null
    };

    var _choisenMainCategoryMeals = {};

    var _choisenMenuId = null;

    var _categories_list = [];

    var _showProfile = function(data) {
        $('.data-block-link .profile').text('Профиль: ' + data.username);
    };

    var _showCategoriesTree = function(list, category_id) {

        $('#categories-data-'+ category_id).append('<ul id="category-ul-' + category_id  + '"></ul>');

        var el = $('#category-ul-' + category_id);

        for (var i = 0; i < list.length; i++) {
            //console.log(list[i].text);

            //Не показывать удаленные категории
            if (list[i].is_deleted) {
                continue;
            }

            el.append('<li id="categories-data-'+ list[i].id + '">'
                + '<span>'+list[i].text+ '</span>'
                +'</li>');

            $('#categories-data-'+ list[i].id).find('span').on("click", {category: list[i]} , function(event){
                _choiceCategory(event.data.category);
            });

            if (list[i].children.length > 0) {
                _showCategoriesTree(list[i].children, list[i].id);
            }
        }
    };

    var _showChoisenMainCategoryMeals = function() {
        var categories_meals = _choisenMainCategoryMeals;
        $('#menu-list').empty();
        for (var cat_id in  categories_meals){
            $('#menu-list').append('<ul id="menu-list-'+cat_id+'">'+categories_meals[cat_id].name+'</ul>');
            for (var meal_id in categories_meals[cat_id].meals) {
                $('#menu-list-'+cat_id).append('<li><span>'+categories_meals[cat_id].meals[meal_id]+'</span>' +
                    '<img src="/static/menu/images/icons/splashyIcons/remove.png" onclick="MenuApp.menu.deleteChoisenMeal('+meal_id+','+cat_id+')" title="Удалить" />'  +
                    '</li>');
            }
        }

        if ($.isEmptyObject(categories_meals)) {
            $('#menu-list').text('Нет выбранных блюд')
        }
    };

    var _loadCategories = function() {
        return $.ajax({
            url: MenuApp.config.api_url + 'book/categories/all/',
            type: 'GET',
            data: {},
            dataType: 'json',
            success: function (res) {
                _categories_list = res;
                _showCategoriesTree(_categories_list, 0);
            },
            error: function (result) {
                errors = result.responseJSON
                for (name in errors) {
                    MenuApp.common.notify(errors[name], 'error');
                }
            }
        });
    };

    var _loadMenuList = function() {
        $("#menu-list-data").empty();
        $("#menu-list-data").append('<img src="/static/menu/images/icons/loading.gif" />');
        return $.ajax({
            url: MenuApp.config.api_url + 'menu/list/',
            type: 'GET',
            data: {},
            dataType: 'json',
            success: function (res) {
                _showMenuList(res);
            },
            error: function (result) {
                //console.log('AAAAAA')
                errors = result.responseJSON
                for (name in errors) {
                    MenuApp.common.notify(errors[name], 'error');
                }
            }
        });
    };

    var _showMenuList = function(menu_list) {
        $("#menu-list-data").empty();

        if (menu_list.length) {
            for (var i=0; i<menu_list.length; i++) {

                $("#menu-list-data").append('<div class="menu-list-data-item" id="menu-list-data-'+menu_list[i].id+'"></div>')
                var block_menu_id = $("#menu-list-data-"+menu_list[i].id);
                if (menu_list[i].current_date) {
                    block_menu_id.addClass('menu-list-current-date');
                }
                block_menu_id.append('<div class="menu-list-data-item-title">' +
                    '<div class="menu-list-data-item-title-date">Меню на ' + menu_list[i].start_date + '&mdash;' + menu_list[i].end_date + '</div>' +
                    '<div class="menu-list-data-item-title-manage">' +
                    '<img src="/static/menu/images/icons/splashyIcons/remove.png" onclick="MenuApp.menu.deleteMenu('+ menu_list[i].id +')" title="Удалить" />' +
                    '<img src="/static/menu/images/icons/splashyIcons/pencil.png" onclick="MenuApp.menu.showChoisenMenu('+ menu_list[i].id +')" title="Редактировать" />' +
                    '</div></div>')

                if (menu_list[i].meals.length) {

                    //block_menu_id.append('<span>Список блюд: </span>');

                    //reformat
                    var menu = {}
                    for (var j = 0; j < menu_list[i].meals.length; j++) {
                        var meal = menu_list[i].meals[j];
                        var main_category = _getMainCategory(meal.category, _categories_list);

                        if (!menu[main_category.id]) {
                            menu[main_category.id] = {
                                'name': main_category.name,
                                'meals': []
                            }
                        }
                        menu[main_category.id]['meals'].push({
                            'id': meal.id,
                            'name': meal.name
                        });
                    }

                    //output in new format
                    for (var k in menu) {
                        block_menu_id.append('<ul id="menu-' + i + '-' + k + '">' + menu[k].name + ': </ul>');
                        for (var l=0; l< menu[k].meals.length; l++) {
                            $("#menu-" + i + '-' + k).append('<li>' + menu[k].meals[l].name + '</li>');
                        }
                    }


                } else {
                    block_menu_id.append('<span>Пока блюд нет</span>');
                }

            }
        } else {
            $("#menu-list-data").append('<p>Пока нет меню</p>');
        }
    };

    var _showChoisenMenuDate = function() {
        if (_choisenDates.start_date && _choisenDates.end_date) {
            $('#menu-range-date-choosen').text('С ' + _choisenDates.start_date + ' по ' + _choisenDates.end_date);
        } else {
            $('#menu-range-date-choosen').text('Выберите период');
        }
    };

    var _choiceCategory = function(category) {
        var category_id = category.id
        //помечаем текущую категорию
        $('#add-meal-block span.current').removeClass('current');
        $('#categories-data-'+category_id+' span:first').addClass('current');

        $.get(MenuApp.config.api_url + "book/categories/" + category_id + "/meals/", function (res) {
            $(".meals-data").empty();

            if (res.length) {
                $(".meals-data").append('<ul class="add-meal-meals-list"></ul>');
                for (var i = 0; i < res.length; i++) {
                    $(".add-meal-meals-list").append('<li>'
                        +'<span id="add-meal-' + res[i].id + '">' + res[i].name + '</span>'
                        +'</li>');

                    $('#add-meal-'+res[i].id).on("click", {meal: res[i], category: category} , function(event){
                        _choiceMeal(event.data.meal);
                    });

                }
            } else {
                $(".meals-data").append('<p>В выбранной категории нет блюд</p>');
            }
        });
    };

    var _getMainCategory = function(sub_category, categories) {
        if (!sub_category.parent_path) {
            return {
                'id': sub_category.id,
                'name': sub_category.name
            }
        } else {
            var main_id = sub_category.parent_path.split('/')[0]
            for (var i=0; i< categories.length; i++) {
                if (categories[i].id == main_id) {
                    return {
                        'id': categories[i].id,
                        'name': categories[i].text
                    }
                }
            }
        }
    };

    var _choiceMeal = function(meal) {
        var main_category = _getMainCategory(meal.category, _categories_list);

        if (!_choisenMainCategoryMeals[main_category.id]) {

            _choisenMainCategoryMeals[main_category.id] = {
                'name': main_category.name,
                'meals': {}
            }
        }

        if (!_choisenMainCategoryMeals[main_category.id].meals[meal.id]) {
            _choisenMainCategoryMeals[main_category.id].meals[meal.id] = meal.name;
        }

        _showChoisenMainCategoryMeals();
    };

    var _loadData = function() {
        $.when(_loadCategories()).then(function(res){
          $.when(_loadMenuList()).then(function(res2){
              //console.log(res,res2);
          })
        })
    };

    scope.saveChoisenMenu = function() {
        if (!_choisenDates.start_date || !_choisenDates.end_date) {
            MenuApp.common.notify('Выберите период', 'error');
            return false;
        }

        choisen_menu = {
            "start_date": _choisenDates.start_date,
            "end_date": _choisenDates.end_date,
            "meals_ids": []
        }

        for (var i in _choisenMainCategoryMeals) {
            for(var meal_id in _choisenMainCategoryMeals[i].meals) {
                choisen_menu.meals_ids.push(parseInt(meal_id));
            }
        }
        if (!choisen_menu.meals_ids.length) {
            MenuApp.common.notify('Выберите хотя бы одно блюдо', 'error');
            return false;
        }

        if (_choisenMenuId) {
            // Редактирование меню
            choisen_menu.id = _choisenMenuId;
            $.ajax({
                url: MenuApp.config.api_url + 'menu/' + choisen_menu.id + '/',
                type: 'PUT',
                data: choisen_menu,
                dataType: 'json',
                success: function (result) {
                    MenuApp.common.notify('Меню было успешно сохранено', 'success');
                    scope.clearChoisenMenu();
                    _loadMenuList();
                },
                error: function (result) {
                    errors = result.responseJSON;
                    for (name in errors) {
                        for (var i = 0; i < errors[name].length; i++) {
                            MenuApp.common.notify(errors[name][i], 'error');
                        }
                    }
                }
            });
        } else {
            // Добавление меню
            $.ajax({
                url: MenuApp.config.api_url + 'menu/list/',
                type: 'POST',
                data: choisen_menu,
                dataType: 'json',
                success: function (result) {
                    if (result.status === 'error') {
                        for (var i = 0; i < result.errors.length; i++) {
                            MenuApp.common.notify(result.errors[i][1], 'error');
                        }
                    } else {
                        MenuApp.common.notify('Меню было успешно сохранено', 'success');
                        scope.clearChoisenMenu();
                        _loadMenuList();
                    }
                },
                error: function (result) {
                    errors = result.responseJSON;
                    for (name in errors) {
                        for (var i = 0; i < errors[name].length; i++) {
                            MenuApp.common.notify(errors[name][i], 'error');
                        }
                    }
                }
            });
        }
    };

    scope.deleteChoisenMeal = function(meal_id, cat_id) {
        delete _choisenMainCategoryMeals[cat_id].meals[meal_id];
        if (!Object.keys(_choisenMainCategoryMeals[cat_id].meals).length) {
            delete _choisenMainCategoryMeals[cat_id];
        }
        _showChoisenMainCategoryMeals();
    };

    scope.deleteMenu = function(id) {
        if (!confirm('Вы действительно хотите удалить меню?')) {
            return false;
        }

        $.ajax({
            url: MenuApp.config.api_url + 'menu/' + id + '/',
            type: 'DELETE',
            data: {},
            dataType: 'json',
            success: function (result) {
                if (id == _choisenMenuId) {
                    scope.clearChoisenMenu();
                }
                _loadMenuList();
                MenuApp.common.notify('Меню было успешно удалено', 'success');
            },
            error: function (result) {
                //
                MenuApp.common.notify('Ошибка удаления', 'error');
            }
        });
    };

    scope.clearChoisenMenu = function() {

        _choisenMainCategoryMeals = {};
        _choisenDates.start_date = null;
        _choisenDates.end_date = null;
        _choisenMenuId = null;

        $('#add-meal-block').hide();
        $('#add-meal-block span.current').removeClass('current');
        $(".meals-data").html('<p>В выбранной категории нет блюд</p>');
        $('#menu-list').text('Нет выбранных блюд');
        _showChoisenMenuDate();

    };

    scope.turnDisplayMealsChoosen = function() {
        if($('#add-meal-block').css('display') == 'none') {
            $('#add-meal-block').show();
            $('#add-meal-block-manage-img').attr('src','/static/menu/images/icons/splashyIcons/arrow_large_up.png');
        } else {
            $('#add-meal-block').hide();
            $('#add-meal-block-manage-img').attr('src','/static/menu/images/icons/splashyIcons/arrow_large_down.png');
        }

    };

    scope.showChoisenMenu = function(menu_id) {
        scope.clearChoisenMenu();
        $('html, body').animate({
            scrollTop: 0
        }, 1000);
        if (menu_id) {
            $.get(MenuApp.config.api_url + "menu/" + menu_id + "/", function (res) {
                //console.log(res);
                _choisenMenuId = res.id;
                _choisenDates.start_date = res.start_date;
                _choisenDates.end_date = res.end_date;
                _showChoisenMenuDate();
                $('#menu-range-date').data('dateRangePicker').setDateRange(_choisenDates.start_date, _choisenDates.end_date, true);

                for (var i =0; i<res.meals.length; i++) {
                    var meal = res.meals[i];
                    _choiceMeal(meal);
                }
            });
        }
    };

    $('#menu-range-date').dateRangePicker({
        format: 'DD.MM.YYYY',
	}).bind('datepicker-apply',function(event,obj) {
	    _choisenDates.start_date = moment(obj.date1).format('DD.MM.YYYY');
		_choisenDates.end_date = moment(obj.date2).format('DD.MM.YYYY');
		_showChoisenMenuDate();
	});


    //load initial data
    _loadData();
    //show Profile
    MenuApp.common.getProfile(_showProfile);

})(MenuApp.menu);