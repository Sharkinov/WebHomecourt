import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../button'

function SettingsSection() {
    const navigate = useNavigate()
    const { signOut } = useAuth()
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await signOut()
            navigate('/login')
        } catch (error) {
            console.error('Error logging out:', error)
            setLoggingOut(false)
        }
    }

    const settingsItems = [
        {
            icon: 'help_outline',
            title: 'Help & Support',
            description: 'FAQ, contact us, report issues',
            iconBg: 'bg-morado-lakers',
            showChevron: true,
            onClick: undefined
        },
        {
            icon: 'logout',
            title: 'Log Out',
            description: '',
            iconBg: 'bg-[#E7E6E8]',
            showChevron: false,
            iconColor: 'text-[#6F6975]',
            onClick: () => setShowLogoutModal(true)
        }
    ]

    return (
        <>
            <div className="bg-white rounded-[15px] overflow-hidden border border-black/8 shadow-[0_4px_4px_0_rgba(0,0,0,0.08)]">

                <div className="h-[59px] bg-morado-oscuro flex items-center px-6">
                    <span className="text-[#F3F2F3] text-[18px]">
                        Settings
                    </span>
                </div>


                <div className="divide-y divide-[#E7E6E8]">
                    {settingsItems.map((item, index) => (
                        <div
                            key={index}
                            className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-[#F9F8FA] transition-colors"
                            onClick={item.onClick}
                        >

                            <div className={`w-12 h-12 ${item.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                <span className={`material-symbols-outlined ${item.iconColor || 'text-white'} text-[24px]`}>
                                    {item.icon}
                                </span>
                            </div>


                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-[#11061A] text-[16px]">
                                    {item.title}
                                </div>
                                {item.description && (
                                    <div className="text-sm text-[#A09CA4]">
                                        {item.description}
                                    </div>
                                )}
                            </div>


                            {item.showChevron && (
                                <span className="material-symbols-outlined text-[#A09CA4] text-[24px] flex-shrink-0">
                                    chevron_right
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/*confirmacioon para logout*/}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-[15px] p-10 max-w-md mx-4">
                        <h2
                            style={{
                                fontFamily: 'Graphik',
                                fontSize: '20px',
                                fontWeight: 500,
                                lineHeight: '30px',
                            }}
                            className="text-texto-oscuro mb-4 pb-4 border-b border-morado-oscuro/20"
                        >
                            Log Out
                        </h2>
                        <p
                            style={{
                                fontFamily: 'Graphik',
                                fontSize: '16px',
                                fontWeight: 400,
                                lineHeight: '24px',
                            }}
                            className="text-Gris-Oscuro mb-8"
                        >
                            Are you sure you want to log out of your account?
                        </p>
                        <div className="flex gap-4">
                            <Button
                                type={loggingOut ? 'primarydisable' : 'secondary'}
                                text={loggingOut ? 'Logging out...' : 'Yes, log out'}
                                onClick={loggingOut ? () => {} : handleLogout}
                            />
                            <Button
                                type="secondary"
                                text="Cancel"
                                onClick={() => setShowLogoutModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default SettingsSection
