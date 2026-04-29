import Nav from '../components/Nav/Nav'
import EditProfile from "../components/Perfil/EditProfile"
import { useNavigate } from "react-router-dom"

function EditarPerfil() {
    const navigate = useNavigate()

    return (
        <div>
            <div >
                <Nav current="Perfil" />
            </div>
            <EditProfile
                onBack={() => navigate("/perfil")}
                onSave={() => navigate("/perfil")}
            />
        </div>
    )
}

export default EditarPerfil