import type { StoreUser, StorePacks } from "../../hooks/storeTypes.ts"; 
import IconButton from '../IconButton.tsx';

type PackCardProp = {
    //itemId: string,
    pack: StorePacks
    rowTitle: string,
    cardDesc: string,
    storeUser: StoreUser,
    openPop: (pack: StorePacks) => void // To open it
}

function PackCard(prop: PackCardProp) {
    return (
        <div
            //itemID={prop.itemId} // hola
            key={prop.pack.pack_id}
            className="w-100% md:w-[25rem] md:h-[16rem] p-4 mb-4 mr-5 bg-white rounded-xl shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] shadow-lg outline outline-[0.80px] outline-offset-[-0.80px] outline-gray-100"
        >
            {/* Left side logo and team name, using h full to use full height of container and align button */}
            <div className="flex flex-row items-stretch mt-2 mb-1 justify-between">
                <img
                    src={prop.pack.closed_URL}
                    alt={prop.pack.name}
                    className="w-20 md:w-32 h-auto"
                />

                {/* Name of pack and cost */}
                <div className="flex flex-col ml-3 mt-4 w-full">
                    {/* Pack details */}
                    <div>
                        <h4 className="font-bold">{prop.pack.pack_name}</h4>
                        <h5 className="font-semibold mb-2">{prop.rowTitle} #{prop.pack.pack_id}</h5>
                        <p className="text-Gris-Oscuro">Win up to {prop.pack.num_cards} cards{prop.cardDesc}</p>
                    </div>

                    {/* Align to bottom, decide button to use depending if user can afford it or not */}
                    <div>
                        {prop.storeUser.credits >= (prop.pack.cost ?? 0) ? (
                            <IconButton
                                type="yellow"
                                leftIcon={
                                    <span className="material-symbols-outlined text-black text-2xl">payments</span>
                                }
                                text={`${prop.pack.cost}`} // Converted to string cause not accepted otherwise 
                                onClick={() => prop.openPop(prop.pack)}//{() => { }} // Will need some business logic but pretty much render the OpenPack compoennt and pass the info it needs
                                className="w-full md:w-28 mt-2 text-md"
                            />
                        ) : (
                            // Not enough credits
                            <IconButton
                                type="primarydisable"
                                leftIcon={
                                    <span className="material-symbols-outlined text-gray-100 text-2xl">payments</span>
                                }
                                text={`${prop.pack.cost}`} // Converted to string cause not accepted otherwise
                                onClick={() => { }} // Will need pop-up logic to check if the user is poor and try to click just sends error like oh no you're poor, or reminds them to sign in if they aren't
                                className="w-full md:w-28 mt-2 text-md"
                            />
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default PackCard