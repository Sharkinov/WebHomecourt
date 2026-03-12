import Nav from '../components/Nav'
import { Unity, useUnityContext } from "react-unity-webgl";

function Juego() {
  const { unityProvider } = useUnityContext({
    loaderUrl: "/Build/RETO.loader.js",
    dataUrl: "/Build/RETO.data",
    frameworkUrl: "/Build/RETO.framework.js",
    codeUrl: "/Build/RETO.wasm",
  });

  return (
    <div className="flex flex-col items-center">

      <h1 className="text-5xl font-bold mt-6">Juego</h1>
      <Nav current="Juego" />

      <div className="mt-8 w-full flex justify-center">
        <Unity
          unityProvider={unityProvider}
          className="
            w-full
            h-[60vh]
            md:w-[960px]
            md:h-[540px]
          "
        />
      </div>

    </div>

  )
}

export default Juego