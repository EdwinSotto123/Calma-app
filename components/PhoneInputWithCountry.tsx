import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Popular Latin American and Spanish-speaking countries
const COUNTRY_CODES = [
    { code: '+51', country: 'Perú', flag: '🇵🇪' },
    { code: '+52', country: 'México', flag: '🇲🇽' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+55', country: 'Brasil', flag: '🇧🇷' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
    { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
    { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
    { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
    { code: '+34', country: 'España', flag: '🇪🇸' },
    { code: '+1', country: 'USA/Canadá', flag: '🇺🇸' },
    { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
    { code: '+507', country: 'Panamá', flag: '🇵🇦' },
    { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
    { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
    { code: '+504', country: 'Honduras', flag: '🇭🇳' },
    { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
    { code: '+809', country: 'Rep. Dominicana', flag: '🇩🇴' },
    { code: '+53', country: 'Cuba', flag: '🇨🇺' },
    { code: '+1787', country: 'Puerto Rico', flag: '🇵🇷' },
];

interface PhoneInputWithCountryProps {
    value: string;
    onChange: (fullPhone: string, countryCode: string, localNumber: string) => void;
    placeholder?: string;
    className?: string;
}

const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
    value,
    onChange,
    placeholder = "Número de teléfono",
    className = ""
}) => {
    // Detect current country code from value or default to Peru
    const detectCountryCode = (phone: string): string => {
        for (const c of COUNTRY_CODES) {
            if (phone.startsWith(c.code)) {
                return c.code;
            }
        }
        return '+51'; // Default to Peru
    };

    const [selectedCode, setSelectedCode] = useState(() => detectCountryCode(value));
    const [localNumber, setLocalNumber] = useState(() => {
        const code = detectCountryCode(value);
        return value.startsWith(code) ? value.slice(code.length) : value.replace(/^\+\d+/, '');
    });
    const [isOpen, setIsOpen] = useState(false);

    const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCode) || COUNTRY_CODES[0];

    const handleCodeChange = (code: string) => {
        setSelectedCode(code);
        setIsOpen(false);
        onChange(`${code}${localNumber}`, code, localNumber);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers
        const num = e.target.value.replace(/\D/g, '');
        setLocalNumber(num);
        onChange(`${selectedCode}${num}`, selectedCode, num);
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            {/* Country Code Selector */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-full px-3 py-4 bg-white/80 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-white transition-colors min-w-[110px]"
                >
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span className="text-sm font-bold text-slate-700">{selectedCountry.code}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-100 z-50 animate-fade-in">
                        {COUNTRY_CODES.map((country) => (
                            <button
                                key={country.code}
                                type="button"
                                onClick={() => handleCodeChange(country.code)}
                                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-teal-50 transition-colors text-left ${selectedCode === country.code ? 'bg-teal-50' : ''
                                    }`}
                            >
                                <span className="text-xl">{country.flag}</span>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-slate-700">{country.country}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-500">{country.code}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Phone Number Input */}
            <input
                type="tel"
                value={localNumber}
                onChange={handleNumberChange}
                placeholder={placeholder}
                className="flex-1 px-4 py-4 bg-white/80 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 outline-none"
            />
        </div>
    );
};

export default PhoneInputWithCountry;
