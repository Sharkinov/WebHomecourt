import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {Question} from "../Brackets/Brackets"
import { getBracketActual } from '../Brackets/getBracket'

function getDaysLeft(question: Question | null): string | null {
  if (!question) return null;

  const now = new Date();
  const close = new Date(question.end_date);

  const diffMs = close.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return `${diffDays} days left`;
};

function MiniBrackets(){
    const [question, setQuestion] = useState<Question | null> (null);
    const [daysLeft, setDaysLeft] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const handleVoteClick = () => {
    if (!question) return;

    navigate(`/brackets`);
  };

    useEffect(() => {
        const loadQuestion = async () => {
            try {
                const data = await getBracketActual();
                setQuestion(data);
                setDaysLeft(getDaysLeft(data));
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
    <div className="self-stretch p-4 md:p-5 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/25 inline-flex flex-col justify-start items-start gap-5 overflow-hidden">
        <div className="self-stretch inline-flex justify-between items-center">
        <h2 className="justify-start text-purple-900 text-xl md:text-2xl font-medium font-['Graphik']">Time to vote</h2>
        <div className="px-2 py-1 bg-yellow-700 rounded-[10px] flex justify-center items-center gap-2 overflow-hidden">
          <h5 className="justify-start text-white text-sm md:text-base font-normal font-['Graphik']">{daysLeft}</h5>
            </div>
        </div>
      <div className="self-stretch p-3 bg-zinc-100 rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/25 flex flex-col justify-start items-start gap-5">
        <h1 className="self-stretch text-center justify-start text-violet-950 text-2xl md:text-3xl font-black font-['Graphik']title1">{question?.question_text}</h1>
          <button type="button" onClick={handleVoteClick} disabled={!question} data-property-1="Default"
        className="self-stretch px-4 py-2.5 bg-purple-900 rounded-2xl inline-flex justify-center items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
          <h3 className="justify-start text-zinc-100 text-xl md:text-2xl font-medium font-['Graphik']title1">Vote now</h3>
          </button>
        </div>
    </div>
    )
}

export default MiniBrackets;