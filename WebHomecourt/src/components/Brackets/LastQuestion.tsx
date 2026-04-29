import { supabase } from "../../lib/supabase"
import { useEffect, useState } from "react";
import type {Question} from "../Brackets/Brackets"
import { getLastQuestion } from './getBracket'

function LastQuestion(){
    const [loggedIn, setLoggedIn] = useState(false);  
    const [question, setQuestion] = useState<Question | null> (null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
    const checkUser = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    setLoggedIn(!!session?.user);
    };

      checkUser();
    }, []);

    useEffect(() => {
        const loadQuestion = async () => {
            try {
                const data = await getLastQuestion();
                setQuestion(data);
            } catch (err) {
                console.error(err)
        } finally {
          setIsLoading(false)
            }
        }
        loadQuestion();
    },[]);

    if (isLoading) return null;

    return(
      <div>
        {(!loggedIn) ? (<div></div>) : (  
        (question && loggedIn) ? (    
          <div className="bg-white p-6 rounded-2xl shadow">
              <h1 className="self-stretch text-center justify-start text-morado-oscuro text-2xl p-2 md:text-3xl ">Previously: {question?.question_text}</h1>
              <h2 className="self-stretch text-center justify-start text-morado-oscuro text-2xl p-2 md:text-3xl ">Winner: {question?.winner}</h2>
          </div>
        ):(
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="self-stretch text-center justify-start text-morado-oscuro text-2xl p-2 md:text-3xl ">There are no previous questions</h2>
          </div>
        ))}
      </div>
    )
}

export default LastQuestion;