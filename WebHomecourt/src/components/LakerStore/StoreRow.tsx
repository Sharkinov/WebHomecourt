import { useState } from 'react';
import type { StoreUser, StorePacks } from "../../hooks/storeTypes.ts"; 
import 'react-horizontal-scrolling-menu/dist/styles.css'; // External to make side scrolling
import OpenPack from './OpenPack.tsx';
//import IconButton from '../IconButton.tsx';
import PackCard from './PackCard.tsx'

type StoreRowProps = {
    packTypeId: number;
    packs: StorePacks[];
    storeUser: StoreUser;
    onCreditsUpdated: (newCredits: number) => void; // To let update the number of credits
};

// Pass the pack type and the user info itself
function StoreRow({ packTypeId, packs, storeUser, onCreditsUpdated }: StoreRowProps) {
    // Pop-up info
    const [openPack, setOpenPack] = useState<null | { packId: number, packImg: string, tearImg: string, openingImg: string, packName: string, packCost: number }>(null); // To open and close pop-up
    const userId = storeUser.user_id ?? ''; // Pass directly to pop-up
    const [page, setPage] = useState(0); // The state

    // Open the pop-up
    function openPop(pack: StorePacks) {
        if (!pack.pack_id) return;
        setOpenPack({
            packId: pack.pack_id,
            packImg: pack.closed_URL,
            tearImg: pack.tear_URL,
            openingImg: pack.opening_URL,
            packName: pack.pack_name ?? '',
            packCost: pack.cost ?? 0,
        });
    }

    // Handler to close the pop-up
    function closePop() {
        setOpenPack(null);
    }

    const rowPacks = packs.filter((pack) => pack.pack_type_id === packTypeId);

    if (rowPacks.length === 0) return null;

    const rowTitle = rowPacks[0].name;
    let cardDesc;

    // To show descriptions for hardcoded card types
    if (rowTitle == "Player Pack") {
        cardDesc = " featuring this player";
    } else if (rowTitle == "Team Pack")
        cardDesc = " featuring players from the Lakers lineup";
    else {
        cardDesc = null; // Or show nothing
    }

    const actualPacks = rowPacks.filter((pack) => pack.pack_id !== null); //  Keeps only packs where there is an id available cause it might be null if there are none of that type

    // Pagination
    const PAGE_SIZE = 3; // Only for comp view
    const totalPages = Math.ceil(actualPacks.length / PAGE_SIZE); // How many pages will be needed rounded up 
    const paginated = actualPacks.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE); // Divide by pages

    return (
        <div className="mt-8 w-full">
            {openPack && (
                <OpenPack
                    open={true}
                    onClose={closePop}
                    userId={userId}
                    packId={openPack.packId}
                    packImg={openPack.packImg}
                    tearImg={openPack.tearImg} // Image w one tear
                    openingImg={openPack.openingImg}
                    packName={openPack.packName}
                    packCost={openPack.packCost}
                    onCreditsUpdated={onCreditsUpdated}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between">
                <h2 className="font-bold mb-2">{rowTitle}</h2>

                {/* Arrows de Regina */}
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="text-black disabled:opacity-30 hover:opacity-75 transition text-6xl px-4"
                    >
                        ‹
                    </button>
                    <span className="text-black text-xl">
                        {page + 1} / {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="text-black disabled:opacity-30 hover:opacity-75 transition text-6xl px-4"
                    >
                        ›
                    </button>
                </div>
            </div>


            {/* Ensure there are packs matching it */}
            {actualPacks.length === 0 ? (
                <p className="w-fit p-4 mb-4 bg-white rounded-xl shadow-[0px_4px_6px_-4px_rgba(0,0,0,0.10)] shadow-lg outline outline-[0.80px] outline-offset-[-0.80px] outline-gray-100">There are currently no {rowTitle}s available, please check back later!</p>
            ) : (
                // Need relative to make it scroll from side to side 
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {/*<ScrollMenu LeftArrow={LeftArrow} RightArrow={RightArrow}>*/}
                    {paginated.map((pack) => (
                        <PackCard
                            itemId={String(pack.pack_id!)} // Doesn't work without ! to ensure not null
                            pack={pack} // Should be like the id tracking I guess?
                            rowTitle={rowTitle}
                            cardDesc={cardDesc ?? ""}
                            storeUser={storeUser}
                            openPop={openPop}
                        />
                    ))}
                    {/*</ScrollMenu>*/}
                </div>
            )}
        </div>
    );
}

export default StoreRow