MenuApp.book = {};

(function (scope) {

    //keep current state
    var _selectedNodeId;

    var _showProfile = function(data) {
        $('.data-block-link .profile').text('Профиль: ' + data.username);
    };

    var _handleCategoryErrors = function(errors) {
        for (name in errors) {
            for (var i = 0; i < errors[name].length; i++) {
                MenuApp.common.notify(errors[name][i], 'error');
            }
        }
    };

    var _handleMealErrors = function(errors) {
        $("#meal-data").addClass('error');

        for (name in errors) {
            for (var i=0; i<errors[name].length; i++) {
                $('form[name="mealForm"] input[name="'+ name +'"]').parent("div").addClass('error');
                $('form[name="mealForm"] input[name="'+ name +'"]').siblings(".error-text").append(errors[name][i]);
                MenuApp.common.notify(errors[name][i], 'error');
            }
        }

    };

    var _removeMealErrors = function(errors) {
        $("#meal-data").removeClass('error');
        $("#meal-data .error" ).removeClass('error');
        $("#meal-data .error-text" ).empty();
    };

    var _categoryShow = function() {
        var ref = $('#tree').jstree(true),
            sel = ref.get_selected();
        if (!sel.length) {
            $(".category-data").empty();
            return false;
        }
        var category = ref.get_node(sel[0]);
        $(".category-data").html(category.text);
    };

    var _subcategoriesShow = function() {
        $(".subcategories").empty();
        var ref = $('#tree').jstree(true),
            sel = ref.get_selected();
        if (!sel.length) {
            return false;
        }

        var children = ref.get_node(sel[0]).children;

        for (var i = 0; i < children.length; i++) {
            var child_node =ref.get_node(children[i]);
            $(".subcategories").append("<a onclick='MenuApp.book.selectCategory("+child_node.id+")'>" + child_node.text + "</a>");
        }

    };

    var _mealsShow = function() {
        $(".meals-data").empty();
        var ref = $('#tree').jstree(true),
            sel = ref.get_selected();
        if (!sel.length) {
            return false;
        }
        //meals show
        $.get(MenuApp.config.api_url + "book/categories/" + sel[0] + "/meals/", function (res) {
            $(".meals-data").append('<a class="meal-data-link" onclick="MenuApp.book.addMealForm()">Добавить блюдо</a>')
            if (res.length) {
                $(".meals-data").append('<ul class="meals-list"></ul>');

                for (var i = 0; i < res.length; i++) {
                    $(".meals-list").append('<li>' + res[i].name +
                        '<img src="/static/menu/images/icons/splashyIcons/pencil.png" onclick=\"MenuApp.book.editMealForm(' + res[i].id + ')" title="Редактировать" />' +
                        '<img src="/static/menu/images/icons/splashyIcons/remove.png" onclick=\"MenuApp.book.deleteMeal(' + res[i].id + ')" title="Удалить" />' +
                        '</li>');
                }
            } else {
                $(".meals-data").append('<p>В выбранной категории пока нет блюд</p>');
            }
        });

    };

    var _clearMealForm = function() {
        $('form[name="mealForm"] input[name="name"]').val('');
        $('form[name="mealForm"] input[name="id"]').val('');
        _removeMealErrors();
    };

    var _refreshCategoryShow = function() {
        _categoryShow();
        _subcategoriesShow();
        _mealsShow();
    };

    scope.addMealForm = function(category_id) {
        _clearMealForm();
        $("#meal-data").show();

        $('html, body').animate({
            scrollTop: $('#meal-data').offset().top
        }, 1000);

    };

    scope.deleteMeal = function(meal_id) {
        if (!confirm('Вы действительно хотите удалить блюдо?')) {
            return false;
        }
        scope.closeMealForm();

        $.ajax({
            url: MenuApp.config.api_url + 'book/meal/'+ meal_id +'/',
            type: 'DELETE',
            data: {
                'id': meal_id
            },
            dataType: 'json',
            success: function (result) {

                _mealsShow();
                MenuApp.common.notify('Блюдо было успешно удалено', 'success');
            },
            error: function (result) {
                //
            }
        });

    };

    scope.editMealForm = function(meal_id) {
        _clearMealForm();

        if (meal_id) {

            $.get(MenuApp.config.api_url + "book/meal/" + meal_id + "/", function (res) {
                $("#meal-data").show();
                $('form[name="mealForm"] input[name="name"]').val(res.name);
                $('form[name="mealForm"] input[name="id"]').val(res.id);
                //$("#meal-data input[name='name']").val(res.name);

                $('html, body').animate({
                    scrollTop: $('#meal-data').offset().top
                }, 500);

            });
        }

    };

    scope.saveMeal = function() {
        _removeMealErrors();
        var name = $('form[name="mealForm"] input[name="name"]').val();
        var id = $('form[name="mealForm"] input[name="id"]').val();
        if (id) {
            //edit
            $.ajax({
                url: MenuApp.config.api_url + 'book/meal/' + id + '/',
                type: 'PUT',
                data: {
                    'id': id,
                    'name': name
                },
                dataType: 'json',
                success: function (result) {
                    scope.closeMealForm();
                    _mealsShow();
                    MenuApp.common.notify('Блюдо было успешно изменено', 'success');
                },
                error: function (result) {
                    if (result.status == 400) {
                        _handleMealErrors(result.responseJSON);
                    } else {
                        console.log(result);
                    }
                }
            });
        } else {
            //add
            var ref = $('#tree').jstree(true),
                sel = ref.get_selected();
            if (!sel.length) {
                return false;
            }
            var category = ref.get_node(sel[0]);

            $.ajax({
                url: MenuApp.config.api_url + 'book/categories/' + category.id + '/meals/',
                type: 'POST',
                data: {
                    'name': name
                },
                dataType: 'json',
                success: function (result) {
                    scope.closeMealForm();
                    _mealsShow();
                    MenuApp.common.notify('Блюдо было успешно добавлено', 'success');
                },
                error: function (result) {
                    if (result.status == 400) {
                        _handleMealErrors(result.responseJSON);
                    } else {
                        console.log(result);
                    }
                }
            });
        }
    };


    scope.closeMealForm = function() {
        $("#meal-data").hide();
        _clearMealForm();
    };

    scope.categoryAdd = function() {
        var ref = $('#tree').jstree(true),
            sel = ref.get_selected(),
            created;
        if (!sel.length) {
            created = ref.create_node('#', {"text": ""}, 'last');
        } else {
            created = ref.create_node(sel[0], {"text": ""}, 'last');
        }

        if (created) {
            ref.edit(created);
        }
    };

    scope.categoryEdit = function() {
        var ref = $('#tree').jstree(true),
            sel = ref.get_selected();
        if (!sel.length) {
            return false;
        }
        ref.edit(sel[0]);
    };

    scope.categoryDelete = function() {
        var ref = $('#tree').jstree(true),
            sel = ref.get_selected();
        if (!sel.length) {
            return false;
        }
        if (!confirm('Вы действительно хотите удалить категорию?')) {
            return false;
        }
        ref.delete_node(sel);
    };

    scope.selectCategory = function(id) {
        var ref = $('#tree').jstree(true);
        ref.deselect_all();
        ref.select_node(id);
    };



    $('#tree')

        .on("changed.jstree", function (e, data) {
            _refreshCategoryShow();
		})

        .on("select_node.jstree", function (e, data) {
            if (_selectedNodeId === data.node.id) {
                data.instance.deselect_node(data.node);
                _selectedNodeId = "";
                scope.closeMealForm();
            } else {
                _selectedNodeId = data.node.id;
            }
        })

        //add and edit category
        .on('rename_node.jstree', function (e, data) {
            if (!parseInt(data.node.id)) {
                //add category
                if (data.text == '') {
                    data.instance.refresh();
                } else {
                    $.ajax({
                        url: MenuApp.config.api_url + 'book/categories/',
                        type: 'POST',
                        data: {
                            'parent': data.node.parent,
                            'name': data.text
                        },
                        dataType: 'json',
                        success: function (result) {
                            data.instance.set_id(data.node, result.id);
                            scope.selectCategory(result.id);
                            MenuApp.common.notify('Категория блюд была создана', 'success');

                        },
                        error: function (result) {
                            _handleCategoryErrors(result.responseJSON);
                            data.instance.refresh();
                        }
                    });
                }

            } else {

                $.ajax({
                    url: MenuApp.config.api_url + 'book/category/' + data.node.id + '/',
                    type: 'PUT',
                    data: {
                        'name': data.text
                    },
                    dataType: 'json',
                    success: function (result) {
                        _categoryShow();
                        MenuApp.common.notify('Категория была успешно изменена', 'success');
                    },
                    error: function (result) {
                        _handleCategoryErrors(result.responseJSON);
                        data.instance.refresh();
                    }
                });

            }

        })
        //delete category
        .on('delete_node.jstree', function (e, data) {

            $.ajax({
                url: MenuApp.config.api_url + 'book/category/' + data.node.id + '/',
                type: 'DELETE',
                data: {
                    //'id': data.node.id
                },
                dataType: 'json',
                success: function (result) {
                    _refreshCategoryShow();
                    MenuApp.common.notify('Категория блюд была удалена', 'success')
                },
                error: function (result) {
                    data.instance.refresh();
                    MenuApp.common.notify('Ошибка удаления', 'error');
                }
            });

        })

        .jstree({

            'core' : {
                "animation" : 0,
				"check_callback" : true,
                'data' : {
                    "url" : function (node) {
                        if (node.id !== '#') {
                            return MenuApp.config.api_url + "book/categories/" + node.id + "/";
                        }

                        return MenuApp.config.api_url + "book/categories/";
                    },
                    "data" : function (node) {
                        return { "id" : node.id };
                    },
                    "error": function (jqXHR, textStatus, errorThrown) {
                        errors = jqXHR.responseJSON
                        for (name in errors) {
                            MenuApp.common.notify(errors[name], 'error');
                        }
                        $('#tree').html('Loading error')
                    }
                }
            },
            "plugins" : [
                 "search", "state"
             ]

        });

    //search by category name
    var _to = false;
    $('#category-search-input').keyup(function () {
        if (to) {
            clearTimeout(_to);
        }
        _to = setTimeout(function () {
            var v = $('#category-search-input').val();
            $('#tree').jstree(true).search(v);
        }, 250);
    });

    $("form[name=\"mealForm\"]").keypress(function (event) {
        if (event.keyCode === 13) { // enter key has code 13
            event.preventDefault();
            scope.saveMeal();
        }
    });

    MenuApp.common.getProfile(_showProfile);

})(MenuApp.book);

