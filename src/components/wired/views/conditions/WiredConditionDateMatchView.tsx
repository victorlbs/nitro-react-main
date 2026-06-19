import { FC, useEffect, useState } from 'react';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const DAYS_OF_WEEK = ['Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado', 'Domingo'];
const MONTHS = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];

export const WiredConditionDateMatchView: FC<{}> = props => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const [days, setDays] = useState<boolean[]>(Array(7).fill(true));
    const [months, setMonths] = useState<boolean[]>(Array(12).fill(true));
    
    const [dayFilter, setDayFilter] = useState<number>(0);
    const [dayExact, setDayExact] = useState<number>(1);
    const [dayStart, setDayStart] = useState<number>(1);
    const [dayEnd, setDayEnd] = useState<number>(1);

    const [yearFilter, setYearFilter] = useState<number>(0);
    const [yearExact, setYearExact] = useState<number>(new Date().getFullYear());
    const [yearStart, setYearStart] = useState<number>(new Date().getFullYear());
    const [yearEnd, setYearEnd] = useState<number>(new Date().getFullYear());

    const [timezone, setTimezone] = useState<string>('America/Sao_Paulo');
    
  
    const availableTimezones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['America/Sao_Paulo', 'Europe/Lisbon', 'UTC'];

    const save = () => {
        let dowMask = 0;
        days.forEach((checked, i) => { if (checked) dowMask |= (1 << i); });

        let monthMask = 0;
        months.forEach((checked, i) => { if (checked) monthMask |= (1 << i); });

        const finalDayStart = dayFilter === 1 ? dayExact : dayStart;
        const finalDayEnd = dayFilter === 2 ? dayEnd : 0;

        const finalYearStart = yearFilter === 1 ? yearExact : yearStart;
        const finalYearEnd = yearFilter === 2 ? yearEnd : 0;

        setIntParams([dowMask, dayFilter, finalDayStart, finalDayEnd, monthMask, yearFilter, finalYearStart, finalYearEnd]);
        setStringParam(timezone);
    };

    useEffect(() => {
        if (!trigger || trigger.intData.length < 8) return;

        const [dowMask, dFilt, dStart, dEnd, mMask, yFilt, yStart, yEnd] = trigger.intData;

        setDays(days.map((_, i) => (dowMask & (1 << i)) !== 0));
        setMonths(months.map((_, i) => (mMask & (1 << i)) !== 0));

        setDayFilter(dFilt);
        if (dFilt === 1) setDayExact(dStart);
        if (dFilt === 2) { setDayStart(dStart); setDayEnd(dEnd); }

        setYearFilter(yFilt);
        if (yFilt === 1) setYearExact(yStart);
        if (yFilt === 2) { setYearStart(yStart); setYearEnd(yEnd); }

        if (trigger.stringData) setTimezone(trigger.stringData);
        
    }, [trigger]);

    const toggleDay = (index: number) => {
        const newDays = [...days];
        newDays[index] = !newDays[index];
        setDays(newDays);
    };

    const toggleMonth = (index: number) => {
        const newMonths = [...months];
        newMonths[index] = !newMonths[index];
        setMonths(newMonths);
    };

    return (
        <WiredConditionBaseView requiresFurni={0} hasSpecialInput={true} save={save}>
            <Column gap={2} className="w-100">
                
                <Column gap={1}>
                    <Text bold>Dia da semana:</Text>
                    <Flex wrap gap={1} className="w-100">
                        {DAYS_OF_WEEK.map((name, i) => (
                            <Flex key={i} alignItems="center" gap={1} className="w-50">
                                <input type="checkbox" className="form-check-input" checked={days[i]} onChange={() => toggleDay(i)} />
                                <Text>{name}</Text>
                            </Flex>
                        ))}
                    </Flex>
                </Column>
                <hr className="m-0 bg-dark" />

                <Column gap={1}>
                    <Text bold>Dia:</Text>
                    <Flex alignItems="center" gap={1}>
                        <input type="radio" className="form-check-input" checked={dayFilter === 0} onChange={() => setDayFilter(0)} />
                        <Text>Não filtrar</Text>
                    </Flex>
                    <Flex alignItems="center" gap={1}>
                        <input type="radio" className="form-check-input" checked={dayFilter === 1} onChange={() => setDayFilter(1)} />
                        <Text>Exato</Text>
                        <input type="number" className="form-control form-control-sm w-25" value={dayExact} disabled={dayFilter !== 1} onChange={e => setDayExact(Number(e.target.value))} />
                    </Flex>
                    <Flex alignItems="center" gap={1}>
                        <input type="radio" className="form-check-input" checked={dayFilter === 2} onChange={() => setDayFilter(2)} />
                        <Text>Período</Text>
                        <input type="number" className="form-control form-control-sm w-25" value={dayStart} disabled={dayFilter !== 2} onChange={e => setDayStart(Number(e.target.value))} />
                        <Text>-</Text>
                        <input type="number" className="form-control form-control-sm w-25" value={dayEnd} disabled={dayFilter !== 2} onChange={e => setDayEnd(Number(e.target.value))} />
                    </Flex>
                </Column>
                <hr className="m-0 bg-dark" />

                <Column gap={1}>
                    <Text bold>Mês:</Text>
                    <Flex wrap gap={1} className="w-100">
                        {MONTHS.map((name, i) => (
                            <Flex key={i} alignItems="center" gap={1} className="w-25">
                                <input type="checkbox" className="form-check-input" checked={months[i]} onChange={() => toggleMonth(i)} />
                                <Text>{name}</Text>
                            </Flex>
                        ))}
                    </Flex>
                </Column>
                <hr className="m-0 bg-dark" />

                <Column gap={1}>
                    <Text bold>Ano:</Text>
                    <Flex alignItems="center" gap={1}>
                        <input type="radio" className="form-check-input" checked={yearFilter === 0} onChange={() => setYearFilter(0)} />
                        <Text>Não filtrar</Text>
                    </Flex>
                    <Flex alignItems="center" gap={1}>
                        <input type="radio" className="form-check-input" checked={yearFilter === 1} onChange={() => setYearFilter(1)} />
                        <Text>Exato</Text>
                        <input type="number" className="form-control form-control-sm w-25" value={yearExact} disabled={yearFilter !== 1} onChange={e => setYearExact(Number(e.target.value))} />
                    </Flex>
                    <Flex alignItems="center" gap={1}>
                        <input type="radio" className="form-check-input" checked={yearFilter === 2} onChange={() => setYearFilter(2)} />
                        <Text>Período</Text>
                        <input type="number" className="form-control form-control-sm w-25" value={yearStart} disabled={yearFilter !== 2} onChange={e => setYearStart(Number(e.target.value))} />
                        <Text>-</Text>
                        <input type="number" className="form-control form-control-sm w-25" value={yearEnd} disabled={yearFilter !== 2} onChange={e => setYearEnd(Number(e.target.value))} />
                    </Flex>
                </Column>
                <hr className="m-0 bg-dark" />

                <Column gap={1}>
                    <Text bold>Selecione o fuso horário:</Text>
                    <select className="form-select form-select-sm" value={timezone} onChange={e => setTimezone(e.target.value)}>
                        {availableTimezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                </Column>
            </Column>
        </WiredConditionBaseView>
    );
}
