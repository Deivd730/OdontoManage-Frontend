class Libro{
    constructor(paginas, autor, precio){
        this._paginas = paginas,
        this._autor = autor,
        this._precio = precio 
    }

    get paginas(){
        return this._paginas;
    }
}