'use strict';

// Глобальный конструктор
Function.prototype.method = function(name, func) {
    if(!this.prototype[name]) {
        this.prototype[name] = func;
        return this;
    }
}

// Работа с методами в script
Array.method("fillIncr", function(length, start) {
    start = start || 0;
    for(let i = 0; i < length; i++) {
        this.push(start + i);
    }
    return this;
})

// Добавление недостающих классов
Element.method("addClass", function(className) {
    let classes = this.className.split(" ");
    if(classes.indexOf(className) < 0) {
        classes.push(className);
        this.className = classes.join(" ").trim();
    }
})

// Удаление повторяющихся классов
Element.method("removeClass", function(className){
    let classes = this.className.split(" ");
    let index = classes.indexOf(className);
    if(index >= 0) {
        classes.splice(index, 1);
        this.className = classes.join(" ").trim();
    }
})


let app = {};

app.Sudoku = function(area) {
    let that = this;
    const table = document.createElement('table');
    table.addClass('sudoku');
    // Конфликт имён
    var area = area || 3;
    let expo = area * area;
    for (let i = 0; i < expo; i++) {
        const row = table.insertRow(-1);
        for(let j = 0; j < expo; j++) {
            let cell = row.insertCell(-1);
            cell.innerHTML = i + ';' + j;

            // Выделение секторов (с помощью деления с остатком)
            switch(i % area) {
                case 0:
                    cell.addClass('top');
                    break;
                case area-1:
                    cell.addClass("bottom");
                    break;
            }
            switch(j % area) {
                case 0:
                    cell.addClass('left');
                    break;
                case area-1:
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
    fill: function(values) {
        const that = this;
        that.values = values;

        for(let i = 0; i < that.expo; i++){
            let row = that.table.rows[i];
            for(let j = 0; j < that.expo; j++) {
                let cell = that.table.rows[i].cells[j];
                cell.innerHTML = values[i][j];
            }
        }
    }
}

// Потом через сервер будет реализация (вывод чисел)
app.Generator = function(area) {
    const that = this;
    var area = area || 3;
    const expo = area * area;
    const base = [].fillIncr(expo, 1);
    var rows = [];

    for(let i = 0; i < expo; i++){
        var row = [];
        // смещение базового массива
        let start = (i % area) * area + parseInt(i / area, 10);
        for(let j = 0; j < expo; j++) {
            row.push(base.slice(start, expo).concat(base)[j]);
        }
        rows.push(row);
    }
    that.rows = rows;
    that.expo = expo;
    that.area = area;
}


let tbl = new app.Sudoku();
document.body.appendChild(tbl.table);

let generator = new app.Generator();
tbl.fill(generator.rows);