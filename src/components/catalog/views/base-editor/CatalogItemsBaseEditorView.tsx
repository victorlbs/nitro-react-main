import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaCopy, FaMagic, FaSave, FaSync, FaTimes, FaTools } from 'react-icons/fa';
import { IPurchasableOffer } from '../../../../api';
import { Button, Column, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';
import './CatalogItemsBaseEditorView.scss';

interface CatalogItemsBaseEditorViewProps
{
    offer: IPurchasableOffer;
}

type EditorFieldType = 'text' | 'number' | 'decimal' | 'select' | 'textarea';

interface EditorField
{
    key: string;
    label: string;
    type: EditorFieldType;
    section: string;
    options?: { value: string; label: string }[];
    readonly?: boolean;
}

interface ItemsBaseData
{
    [key: string]: any;
}

const API_GET_URL = '/api_items_base_get.php';
const API_UPDATE_URL = '/api_items_base_update.php';

const FIELDS: EditorField[] = [
    { key: 'id', label: 'Base ID', type: 'number', section: 'Identificação', readonly: true },
    { key: 'sprite_id', label: 'Sprite ID', type: 'number', section: 'Identificação' },
    { key: 'public_name', label: 'Nome público', type: 'text', section: 'Identificação' },
    { key: 'item_name', label: 'Nome interno', type: 'text', section: 'Identificação' },
    { key: 'type', label: 'Tipo', type: 'select', section: 'Identificação', options: [ { value: 's', label: 's - chão' }, { value: 'i', label: 'i - parede' } ] },

    { key: 'width', label: 'Largura', type: 'number', section: 'Tamanho' },
    { key: 'length', label: 'Tamanho', type: 'number', section: 'Tamanho' },
    { key: 'stack_height', label: 'Altura', type: 'decimal', section: 'Tamanho' },
    { key: 'multiheight', label: 'Multiheight', type: 'text', section: 'Tamanho' },

    { key: 'allow_stack', label: 'Pode empilhar', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },
    { key: 'allow_sit', label: 'Pode sentar', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },
    { key: 'allow_lay', label: 'Pode deitar', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },
    { key: 'allow_walk', label: 'Pode andar', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },
    { key: 'allow_gift', label: 'Pode presentear', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },
    { key: 'allow_trade', label: 'Pode trocar', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },
    { key: 'allow_recycle', label: 'Pode reciclar', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },
    { key: 'allow_marketplace_sell', label: 'Pode mercado', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },
    { key: 'allow_inventory_stack', label: 'Juntar inventário', type: 'select', section: 'Permissões', options: [ { value: '0', label: 'Não' }, { value: '1', label: 'Sim' } ] },

    { key: 'interaction_type', label: 'Interaction type', type: 'text', section: 'Interação' },
    { key: 'interaction_modes_count', label: 'Modos interação', type: 'number', section: 'Interação' },
    { key: 'vending_ids', label: 'Vending IDs', type: 'text', section: 'Interação' },
    { key: 'customparams', label: 'Custom params', type: 'textarea', section: 'Interação' },
    { key: 'effect_id_male', label: 'Effect male', type: 'number', section: 'Interação' },
    { key: 'effect_id_female', label: 'Effect female', type: 'number', section: 'Interação' },
    { key: 'clothing_on_walk', label: 'Roupa ao andar', type: 'text', section: 'Interação' },
    { key: 'wired_data', label: 'Wired data', type: 'text', section: 'Interação' }
];

const PRESETS: { name: string; values: Partial<ItemsBaseData> }[] = [
    {
        name: 'Decoração',
        values: {
            type: 's', width: 1, length: 1, stack_height: '0.00', allow_stack: 1, allow_sit: 0, allow_lay: 0, allow_walk: 0,
            allow_gift: 1, allow_trade: 1, allow_recycle: 0, allow_marketplace_sell: 0, allow_inventory_stack: 1,
            interaction_type: 'default', interaction_modes_count: 1
        }
    },
    {
        name: 'Piso andando',
        values: {
            type: 's', width: 1, length: 1, stack_height: '0.00', allow_stack: 1, allow_sit: 0, allow_lay: 0, allow_walk: 1,
            allow_gift: 1, allow_trade: 1, allow_inventory_stack: 1, interaction_type: 'default', interaction_modes_count: 1
        }
    },
    {
        name: 'Cadeira',
        values: {
            type: 's', width: 1, length: 1, stack_height: '1.00', allow_stack: 0, allow_sit: 1, allow_lay: 0, allow_walk: 0,
            allow_gift: 1, allow_trade: 1, allow_inventory_stack: 1, interaction_type: 'default', interaction_modes_count: 1
        }
    },
    {
        name: 'Cama',
        values: {
            type: 's', width: 2, length: 2, stack_height: '1.00', allow_stack: 0, allow_sit: 0, allow_lay: 1, allow_walk: 0,
            allow_gift: 1, allow_trade: 1, allow_inventory_stack: 1, interaction_type: 'default', interaction_modes_count: 1
        }
    },
    {
        name: 'Wired',
        values: {
            type: 's', width: 1, length: 1, stack_height: '0.00', allow_stack: 1, allow_sit: 0, allow_lay: 0, allow_walk: 0,
            allow_gift: 1, allow_trade: 1, allow_inventory_stack: 1, interaction_modes_count: 1
        }
    },
    {
        name: 'Parede',
        values: {
            type: 'i', width: 1, length: 1, stack_height: '0.00', allow_stack: 0, allow_sit: 0, allow_lay: 0, allow_walk: 0,
            allow_gift: 1, allow_trade: 1, allow_inventory_stack: 1, interaction_type: 'default', interaction_modes_count: 1
        }
    }
];

const getOfferProductClassId = (offer: IPurchasableOffer) =>
{
    const product = (offer as any)?.product;
    const furniData = product?.furnitureData;

    return Number(product?.productClassId ?? product?.furnitureClassId ?? furniData?.id ?? furniData?.spriteId ?? 0);
};

const getOfferClassName = (offer: IPurchasableOffer) =>
{
    const product = (offer as any)?.product;
    const furniData = product?.furnitureData;

    return String(furniData?.className ?? product?.className ?? product?.extraParam ?? offer?.localizationName ?? '');
};

const getOfferName = (offer: IPurchasableOffer) =>
{
    return String(offer?.localizationName ?? getOfferClassName(offer) ?? 'Mobi');
};

const normalizeValue = (value: any) =>
{
    if(value === null || value === undefined) return '';

    return String(value);
};

export const CatalogItemsBaseEditorView: FC<CatalogItemsBaseEditorViewProps> = props =>
{
    const { offer = null } = props;
    const [ canEdit, setCanEdit ] = useState(false);
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ isSaving, setIsSaving ] = useState(false);
    const [ baseItem, setBaseItem ] = useState<ItemsBaseData>(null);
    const [ originalBaseItem, setOriginalBaseItem ] = useState<ItemsBaseData>(null);
    const [ message, setMessage ] = useState('');
    const [ error, setError ] = useState('');

    const productClassId = useMemo(() => getOfferProductClassId(offer), [ offer ]);
    const className = useMemo(() => getOfferClassName(offer), [ offer ]);
    const offerName = useMemo(() => getOfferName(offer), [ offer ]);

    const hasValidOffer = !!offer && (!!productClassId || !!className);

    const changedCount = useMemo(() =>
    {
        if(!baseItem || !originalBaseItem) return 0;

        let count = 0;

        for(const field of FIELDS)
        {
            if(field.readonly) continue;

            if(normalizeValue(baseItem[field.key]) !== normalizeValue(originalBaseItem[field.key])) count++;
        }

        return count;
    }, [ baseItem, originalBaseItem ]);

    const fieldSections = useMemo(() =>
    {
        const sections: string[] = [];

        for(const field of FIELDS)
        {
            if(sections.indexOf(field.section) === -1) sections.push(field.section);
        }

        return sections;
    }, []);

    useEffect(() =>
    {
        fetch(`${ API_GET_URL }?action=permission`, {
            credentials: 'include',
            cache: 'no-store',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
            .then(response => response.json())
            .then(data => setCanEdit(!!data?.canEdit))
            .catch(() => setCanEdit(false));
    }, []);

    const loadBaseItem = useCallback(() =>
    {
        if(!hasValidOffer) return;

        setIsLoading(true);
        setError('');
        setMessage('');

        const params = new URLSearchParams();

        params.set('product_class_id', String(productClassId || 0));
        params.set('class_name', className || '');
        params.set('offer_name', offerName || '');

        fetch(`${ API_GET_URL }?${ params.toString() }`, {
            credentials: 'include',
            cache: 'no-store',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
            .then(response => response.json())
            .then(data =>
            {
                if(!data || !data.success)
                {
                    setBaseItem(null);
                    setOriginalBaseItem(null);
                    setError(data?.error || 'Não foi possível carregar o items_base.');
                    return;
                }

                setBaseItem(data.item || null);
                setOriginalBaseItem(data.item ? { ...data.item } : null);
            })
            .catch(error =>
            {
                console.error('[ItemsBaseEditor] GET error:', error);
                setError('Erro ao consultar o PHP.');
            })
            .finally(() => setIsLoading(false));
    }, [ hasValidOffer, productClassId, className, offerName ]);

    const openEditor = () =>
    {
        setIsVisible(true);
        loadBaseItem();
    };

    const closeEditor = () =>
    {
        if(changedCount > 0 && !window.confirm('Existem alterações não salvas. Deseja fechar mesmo assim?')) return;

        setIsVisible(false);
    };

    const updateField = (field: string, value: any) =>
    {
        setBaseItem(prevValue => ({ ...(prevValue || {}), [field]: value }));
    };

    const applyPreset = (values: Partial<ItemsBaseData>) =>
    {
        setBaseItem(prevValue => ({ ...(prevValue || {}), ...values }));
    };

    const copySql = () =>
    {
        if(!baseItem?.id) return;

        const updates: string[] = [];

        for(const field of FIELDS)
        {
            if(field.readonly) continue;

            const value = normalizeValue(baseItem[field.key]).replace(/'/g, "''");

            updates.push(`\`${ field.key }\`='${ value }'`);
        }

        const sql = `UPDATE items_base SET ${ updates.join(', ') } WHERE id='${ baseItem.id }' LIMIT 1;`;

        navigator.clipboard?.writeText(sql);
        setMessage('SQL copiado.');
    };

    const save = () =>
    {
        if(!baseItem?.id || isSaving) return;

        setIsSaving(true);
        setError('');
        setMessage('');

        const fields: ItemsBaseData = {};

        for(const field of FIELDS)
        {
            if(field.readonly) continue;

            if(normalizeValue(baseItem[field.key]) !== normalizeValue(originalBaseItem?.[field.key]))
            {
                fields[field.key] = baseItem[field.key];
            }
        }

        if(!Object.keys(fields).length)
        {
            setMessage('Nenhuma alteração para salvar.');
            setIsSaving(false);
            return;
        }

        fetch(API_UPDATE_URL, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                base_id: Number(baseItem.id),
                fields
            })
        })
            .then(response => response.json())
            .then(data =>
            {
                if(!data || !data.success)
                {
                    setError(data?.error || 'Erro ao salvar alterações.');
                    return;
                }

                setMessage(`Salvo com sucesso. Campos alterados: ${ data.changed || 0 }.`);
                setOriginalBaseItem({ ...baseItem });
            })
            .catch(error =>
            {
                console.error('[ItemsBaseEditor] UPDATE error:', error);
                setError('Erro ao enviar alterações para o PHP.');
            })
            .finally(() => setIsSaving(false));
    };

    const renderInput = (field: EditorField) =>
    {
        const value = normalizeValue(baseItem?.[field.key]);
        const isChanged = originalBaseItem && (normalizeValue(originalBaseItem[field.key]) !== value);

        if(field.type === 'select')
        {
            return (
                <select
                    value={ value }
                    disabled={ field.readonly }
                    className={ isChanged ? 'changed' : '' }
                    onChange={ event => updateField(field.key, event.target.value) }
                >
                    { field.options.map(option => <option key={ option.value } value={ option.value }>{ option.label }</option>) }
                </select>
            );
        }

        if(field.type === 'textarea')
        {
            return (
                <textarea
                    value={ value }
                    disabled={ field.readonly }
                    className={ isChanged ? 'changed' : '' }
                    onChange={ event => updateField(field.key, event.target.value) }
                />
            );
        }

        return (
            <input
                type={ (field.type === 'number' || field.type === 'decimal') ? 'text' : 'text' }
                value={ value }
                disabled={ field.readonly }
                className={ isChanged ? 'changed' : '' }
                onChange={ event => updateField(field.key, event.target.value) }
            />
        );
    };

    if(!canEdit || !hasValidOffer) return null;

    return (
        <>
            <Button variant="secondary" className="catalog-items-base-editor-open" onClick={ openEditor }>
                <FaTools className="fa-icon" /> Editar Base
            </Button>

            { isVisible &&
                <NitroCardView uniqueKey="catalog-items-base-editor" className="catalog-items-base-editor-window" theme="primary-slim">
                    <NitroCardHeaderView headerText="Editor de Items Base" onCloseClick={ closeEditor } />
                    <NitroCardContentView className="catalog-items-base-editor-content">
                        <Flex alignItems="center" justifyContent="between" gap={ 2 } className="items-base-editor-topbar">
                            <Column gap={ 0 } overflow="hidden">
                                <Text bold truncate>{ offerName }</Text>
                                <Text small truncate>{ className || 'Sem classname' } | Produto: { productClassId || '-' }</Text>
                            </Column>
                            <Flex gap={ 1 }>
                                <Button variant="secondary" onClick={ loadBaseItem } disabled={ isLoading }>
                                    <FaSync className="fa-icon" /> Recarregar
                                </Button>
                                <Button variant="secondary" onClick={ copySql } disabled={ !baseItem }>
                                    <FaCopy className="fa-icon" /> Copiar SQL
                                </Button>
                                <Button variant="success" onClick={ save } disabled={ !baseItem || isSaving || !changedCount }>
                                    <FaSave className="fa-icon" /> Salvar { changedCount ? `(${ changedCount })` : '' }
                                </Button>
                            </Flex>
                        </Flex>

                        { isLoading && <div className="items-base-editor-message">Carregando items_base...</div> }
                        { !!error && <div className="items-base-editor-error">{ error }</div> }
                        { !!message && <div className="items-base-editor-success">{ message }</div> }

                        { baseItem &&
                            <>
                                <div className="items-base-editor-presets">
                                    <span><FaMagic /> Presets rápidos:</span>
                                    { PRESETS.map(preset =>
                                        <button key={ preset.name } type="button" onClick={ () => applyPreset(preset.values) }>
                                            { preset.name }
                                        </button>) }
                                </div>

                                <div className="items-base-editor-grid">
                                    { fieldSections.map(section =>
                                        <div key={ section } className="items-base-editor-section">
                                            <div className="items-base-editor-section-title">{ section }</div>
                                            { FIELDS.filter(field => field.section === section).map(field =>
                                                <label key={ field.key } className="items-base-editor-field">
                                                    <span>{ field.label }</span>
                                                    { renderInput(field) }
                                                </label>) }
                                        </div>) }
                                </div>

                                <div className="items-base-editor-warning">
                                    <b>Atenção:</b> editar items_base muda todos os mobis iguais do hotel. Algumas alterações só aparecem depois de recarregar catálogo/emulador/cache.
                                </div>
                            </> }

                        <Flex justifyContent="end" gap={ 1 }>
                            <Button variant="danger" onClick={ closeEditor }>
                                <FaTimes className="fa-icon" /> Fechar
                            </Button>
                        </Flex>
                    </NitroCardContentView>
                </NitroCardView> }
        </>
    );
};
