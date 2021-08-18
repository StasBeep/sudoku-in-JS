'use strict';

const util = {
    randomInteger: function (min, max) {
        return Math.floor(min + Math.random() * (max + 1 - min));
    }
}

// Глобальный конструктор
Function.prototype.method = function (name, func) {
    if (!this.prototype[name]) {
        this.prototype[name] = func;
        return this;
    }
}

// Работа с массивами на верхнем уровне
Array.method("fillIncr", function (length, start) {
    start = start || 0;
    for (let i = 0; i < length; i++) {
        this.push(start + i);
    }
    return this;
})

/**
 * Метод подобен shift и pop, но удаляет и возвращает случайный член массива
 */
Array.method('popRandom', function () {
    return this.splice(Math.floor(Math.random() * this.length), 1)[0];
})

Array.method("shuffle", function () {
    for (let i = 0; i < this.length; i++) {
        let index = Math.floor(Math.random() * (i + 1));
        let saved = this[index];
        this[index] = this[i];
        this[i] = saved;
    }
    return this;
})

// Добавление недостающих классов
Element.method("addClass", function (className) {
    let classes = this.className.split(" ");
    if (classes.indexOf(className) < 0) {
        classes.push(className);
        this.className = classes.join(" ").trim();
    }
})

// Удаление повторяющихся классов
Element.method("removeClass", function (className) {
    let classes = this.className.split(" ");
    let index = classes.indexOf(className);
    if (index >= 0) {
        classes.splice(index, 1);
        this.className = classes.join(" ").trim();
    }
})


let app = {};

app.Sudoku = function (area) {
    let that = this;
    const table = document.createElement('table');
    table.addClass('sudoku');
    // Конфликт имён
    var area = area || 3;
    let expo = area * area;
    for (let i = 0; i < expo; i++) {
        const row = table.insertRow(-1);
        for (let j = 0; j < expo; j++) {
            let cell = row.insertCell(-1);
            cell.innerHTML = i + ';' + j;

            // Выделение секторов (с помощью деления с остатком)
            switch (i % area) {
                case 0:
                    cell.addClass('top');
                    break;
                case area - 1:
                    cell.addClass("bottom");
                    break;
            }
            switch (j % area) {
                case 0:
                    cell.addClass('left');
                    break;
                case area - 1:
                    cell.addClass("right");
                    break;
            }
        }
    }
    // Определение для внешнего доступа
    that.table = table;
    that.expo = expo;
}

// Определение прототипа для класса Sudoku
app.Sudoku.prototype = {
    fill: function (values) {
        const that = this;
        that.values = values;

        for (let i = 0; i < that.expo; i++) {
            let row = that.table.rows[i];
            for (let j = 0; j < that.expo; j++) {
                let cell = that.table.rows[i].cells[j];
                cell.innerHTML = values[i][j];
            }
        }
    },

    hide: function (count) {
        const that = this;
        for (let i = 0; i < count; i++) {
            let processing = true;
            // Избегаем повторения полей, чтобы скрыть ненужное количество
            while (processing) {
                let rowNumber = util.randomInteger(0, that.expo - 1);
                let colNumber = util.randomInteger(0, that.expo - 1);
                // если поле уже скрыто, выбираем новое значение
                if (!that.table.rows[rowNumber].cells[colNumber].hidden) {
                    that.table.rows[rowNumber].cells[colNumber].hidden = true;
                    that.table.rows[rowNumber].cells[colNumber].innerHTML = "";
                    let editCell = document.createElement("input");
                    that.table.rows[rowNumber].cells[colNumber].appendChild(editCell);
                    that.table.rows[rowNumber].cells[colNumber].editCell = editCell;
                    // Добавляем событие на изменение значения поля
                    editCell.addEventListener("change", function () {
                        that.check();
                    });
                    processing = false;
                }
            }
        }
    },

    check: function () {
        const that = this;
        that.unmark();

        // Создаём и заполняем проверочные массивы. По ним отслеживаем,
        // чтобы значения не повторялись
        let rows = [],
            columns = [],
            areas = [];
        for (let i = 0; i < that.expo; i++) {
            rows.push([].fillIncr(that.expo, 1));
            columns.push([].fillIncr(that.expo, 1));
            areas.push([].fillIncr(that.expo, 1));
        }

        // Проверяем значения
        Array.prototype.forEach.call(that.table.rows, function (row, i) {
            Array.prototype.forEach.call(row.cells, function (cell, j) {
                let value = that.getValue(cell);
                // в проверочных массивах заменяем существующие в игровом поле
                // значения на 0
                rows[i].findAndReplace(value, 0);
                columns[j].findAndReplace(value, 0);
                areas[that.getArea(i, j)].findAndReplace(value, 0);
            });
        });

        // Проверяем правильность заполнения, создаём счётчик для проверки
        let correct = {
            rows: 0,
            columns: 0,
            areas: 0
        };

        for (let i = 0; i < that.expo; i++) {
            // если все цифры в группе уникальны, помечаем группу, увеличиваем счётчик
            if (rows[i].allMembers(0)) {
                that.markRow(i);
                correct.rows++;
            }
            if (columns[i].allMembers(0)) {
                that.markColumn(i);
                correct.columns++;
            }
            if (areas[i].allMembers(0)) {
                that.markArea(i);
                correct.areas++;
            }

            // если все группы отмечены как правильные, игра заканчивается
            if (correct.rows === that.expo &&
                correct.columns === that.expo &&
                correct.areas === that.expo) {
                if (typeof (that.win) === 'function') {
                    that.win();
                }
            }
        }
    },

    // отмечает ячейку cell классом, либо снимает класс, в зависимости от state
    markCell: function (cell, state) {
        if (state) {
            cell.addClass('marked');
        } else {
            cell.removeClass('marked');
        }
    },

    // возвращает значение ячейки, для поля, либо простой ячейки
    getValue: function (cell) {
        if (cell.editCell) {
            return parseInt(cell.editCell.value, 10);
        } else {
            return parseInt(cell.innerHTML, 10);
        }
    },

    // отмечает строку целиком
    markRow: function (number) {
        const that = this;
        Array.prototype.forEach.call(that.table.rows[number].cells, function (cell) {
            that.markCell(cell, true);
        })
    },

    // отмечает колонку целиком
    markColumn: function (number) {
        const that = this;
        Array.prototype.forEach.call(that.table.rows, function (row) {
            that.markCell(row.cells[number], true);
        })
    },

    // отмечает область целиком
    markArea: function (number) {
        const that = this;
        let area = Math.sqrt(that.expo);
        let startRow = parseInt(number / area, 10) * area;
        let startColumn = (number % area) * area;
        for (let i = 0; i < area; i++) {
            for (let j = 0; j < area; j++) {
                that.markCell(that.table.rows[i + startRow].cells[j + startColumn], true);
            }
        }
    },

    // Снимает отметки со всего игрового поля
    unmark: function () {
        const that = this;
        Array.prototype.forEach.call(that.table.rows, function (row, i) {
            Array.prototype.forEach.call(row.cells, function (cell, j) {
                that.markCell(cell, false);
            })
        })
    }
}

// Потом через сервер будет реализация (вывод чисел)
app.Generator = function (area) {
    const that = this;
    var area = area || 3;
    const expo = area * area;
    const base = [].fillIncr(expo, 1);
    var rows = [];

    for (let i = 0; i < expo; i++) {
        var row = [];
        // смещение базового массива
        let start = (i % area) * area + parseInt(i / area, 10);
        for (let j = 0; j < expo; j++) {
            row.push(base.slice(start, expo).concat(base)[j]);
        }
        rows.push(row);
    }
    that.rows = rows;
    that.expo = expo;
    that.area = area;
}

/**
 * Прототип перемешивания цисел таблицы
 */
app.Generator.prototype = {
    invertVerrtical: function () {
        const that = this;
        that.rows.reverse();
        return that;
    },

    invertHorizontal: function () {
        const that = this;
        for (let i = 0; i < that.expo; i++) {
            that.rows[i].reverse();
        }
        return that;
    },

    getPositions: function () {
        let source = [].fillIncr(this.area);
        let positions = {
            startPos: source.popRandom(),
            destPos: source.popRandom()
        }
        return positions;
    },

    // Перемешивание строки
    swapRows: function (count) {
        const that = this;
        for (let i = 0; i < count; i++) {
            let area = util.randomInteger(0, that.area - 1);
            let values = that.getPositions();
            let sourcePosition = area + that.area + values.startPos;
            let destPosition = area * that.area + values.destPos;
            let row = that.rows.splice(sourcePosition, 1)[0];
            that.rows.splice(destPosition, 0, row);
        }
        return that;
    },

    // Перемешивание столбца
    swapColumns: function (count) {
        const that = this;
        for (let i = 0; i < count; i++) {
            let area = util.randomInteger(0, that.area - 1);
            let values = that.getPositions();
            let sourcePosition = area + that.area + values.startPos;
            let destPosition = area * that.area + values.destPos;
            for (let i = 0; i < that.expo; i++) {
                let cell = that.rows[i].splice(sourcePosition, 1)[0];
                that.rows[i].splice(destPosition, 0, cell);
            }
        }
        return that;
    },

    // Пееремешивает горизонтальные области
    swapRowsRange: function (count) {
        let that = this;
        for (let i = 0; i < count; i++) {
            let values = that.getPositions();
            let rows = that.rows.splice(values.startPos + that.area, that.area);
            let args = [values.destPos * that.area, 0].concat(rows);
            that.rows.splice.apply(that.rows, args);
        }
        return that;
    },

    // Перемешиивает вертикальные области
    swapColumnsRange: function (count) {
        let that = this;
        for (let i = 0; i < count; i++) {
            let values = that.getPositions();
            for (let j = 0; j < that.expo; j++) {
                let cells = that.rows[j].splice(values.startPos + that.area, that.area);
                let args = [values.destPos * that.area, 0].concat(cells);
                that.rows[j].splice.apply(that.rows[j], args);
            }
        }
        return that;
    },

    /**
     * Метод качественной перетасовки цифр в таблице значений
     */
    shakeAll: function () {
        const that = this;
        let shaked = [].fillIncr(that.expo, 1);
        // Смешиваем массив случайным образом
        shaked.shuffle();
        for (let i = 0; i < that.expo; i++) {
            for (let j = 0; j < that.expo; j++) {
                that.rows[i][j] = shaked[that.rows[i][j] - 1];
            }
        }
    }
}

let tbl = new app.Sudoku();
document.querySelector('#playGround').appendChild(tbl.table);

let generator = new app.Generator();

// Перемешивание
// generator.invertVerrtical().swapRows(15);
// Четыре метода перемешивания
generator.swapColumnsRange(15)
    .swapRowsRange(15)
    .swapColumns(15)
    .swapRows(15)
    .shakeAll();

// Перемешивание стандартное (по вероятности 1:1)
util.randomInteger(0, 1) ? generator.invertHorizontal() : 0;
util.randomInteger(0, 1) ? generator.invertVerrtical() : 0;

tbl.fill(generator.rows);

tbl.hide(45);