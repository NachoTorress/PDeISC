import "./Tarjeta.css";

// Datos que recibe la tarjeta desde el componente que la usa (App)
type TarjetaProps = {
    nombre: string;
    apellido: string;
    profesion: string;
    imagen: string;
};

/**
 * Tarjeta
 * Tarjeta de presentacion con foto, nombre, apellido y profesion.
 * Todos los datos llegan por props, el componente solo se encarga
 * de mostrarlos con estilo de tipo "profile card".
 */
function Tarjeta({ nombre, apellido, profesion, imagen }: TarjetaProps) {
    return (
        <div className="tarjeta">
            <div className="tarjeta-banner" />

            <img src={imagen} alt={`Foto de ${nombre}`} className="tarjeta-foto" />

            <div className="tarjeta-info">
                <h2>
                    {nombre} {apellido}
                </h2>
                <span className="tarjeta-profesion">{profesion}</span>
            </div>
        </div>
    );
}

export default Tarjeta;
