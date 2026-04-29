import Nav from '../components/Nav/Nav'
import { Unity, useUnityContext } from "react-unity-webgl";

function Juego() {
  const { unityProvider } = useUnityContext({
    loaderUrl: "/Build/RETO.loader.js",
    dataUrl: "/Build/RETO.data",
    frameworkUrl: "/Build/RETO.framework.js",
    codeUrl: "/Build/RETO.wasm",
  });

  return (
    <div>

      <Nav current="Juego" />

      <h1 className="text-5xl font-bold mt-10 mb-10">Game</h1>

      <div className="w-[90vw] max-w-[1600px] aspect-video">
        <Unity
          unityProvider={unityProvider}
          style={{
            width: "100%",
            height: "90%",
          }}
        />
      </div>

    </div>
  );
}

export default Juego;