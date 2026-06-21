import { FC, useEffect, useState } from 'react';
import ReactSlider from 'react-slider';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * Interface do usuário para a condição "Selecionar Quantidade". Permite ao
 * jogador definir se o valor contado deve ser menor que, igual ou maior que
 * um valor escolhido e selecionar a origem dessa contagem. As possíveis
 * fontes incluem mobis selecionados, o somatório dos valores de placares
 * (scoreboards), o somatório dos valores de placares digitais ou a
 * contagem de itens que ativaram a pilha.
 */
export const WiredConditionSelectQuantityView: FC<{}> = () =>
{
    // Modos de comparação: 0 = menor que, 1 = igual, 2 = maior que
    const [ comparisonMode, setComparisonMode ] = useState(0);
    // Valor numérico a ser comparado
    const [ quantity, setQuantity ] = useState(1);
    // Tipo de fonte: 0 = mobis selecionados, 1 = placares, 2 = placares digitais, 3 = itens de ativação
    const [ source, setSource ] = useState(0);

    // Hook para interação com o wired
    const { trigger = null, setIntParams = null } = useWired();

    // Carrega valores salvos ao editar o wired existente
    useEffect(() =>
    {
        if (!trigger || !Array.isArray(trigger.intData)) return;
        const data = trigger.intData;
        if (data.length >= 3)
        {
            setComparisonMode(parseInt(data[0]) || 0);
            setQuantity(parseInt(data[1]) || 0);
            setSource(parseInt(data[2]) || 0);
        }
    }, [ trigger ]);

    // Envia os parâmetros selecionados para o emulador
    const save = () =>
    {
        if (setIntParams) setIntParams([ comparisonMode, quantity, source ]);
    };

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } hasSpecialInput={ true } save={ save }>
            <Column gap={ 2 }>
                {/* Seleção do comparador */}
                <Column gap={ 1 }>
                    <Text bold>Escolha o tipo</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="compareLess" name="comparisonMode" checked={ comparisonMode === 0 } onChange={ () => setComparisonMode(0) } />
                        <label htmlFor="compareLess">Menor que</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="compareEqual" name="comparisonMode" checked={ comparisonMode === 1 } onChange={ () => setComparisonMode(1) } />
                        <label htmlFor="compareEqual">Igual</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="compareGreater" name="comparisonMode" checked={ comparisonMode === 2 } onChange={ () => setComparisonMode(2) } />
                        <label htmlFor="compareGreater">Maior que</label>
                    </Flex>
                </Column>

                {/* Seleção do valor */}
                <Column gap={ 1 }>
                    <Text bold>Quantidade: { quantity }</Text>
                    <ReactSlider
                        className={ 'nitro-slider' }
                        min={ 0 }
                        max={ 100 }
                        value={ quantity }
                        onChange={ event => setQuantity(event) }
                    />
                </Column>

                {/* Seleção da fonte */}
                <Column gap={ 1 }>
                    <Text bold>Selecione a fonte</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="sourceFurni" name="source" checked={ source === 0 } onChange={ () => setSource(0) } />
                        <label htmlFor="sourceFurni">Mobis selecionados</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="sourceScore" name="source" checked={ source === 1 } onChange={ () => setSource(1) } />
                        <label htmlFor="sourceScore">Placar</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="sourceDigital" name="source" checked={ source === 2 } onChange={ () => setSource(2) } />
                        <label htmlFor="sourceDigital">Placar digital</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="sourceActivation" name="source" checked={ source === 3 } onChange={ () => setSource(3) } />
                        <label htmlFor="sourceActivation">Itens de ativação</label>
                    </Flex>
                </Column>
            </Column>
        </WiredConditionBaseView>
    );
};
