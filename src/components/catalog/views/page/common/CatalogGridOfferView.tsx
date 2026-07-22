import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useMemo, useState } from 'react';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { IPurchasableOffer, Offer, ProductTypeEnum } from '../../../../../api';
import { LayoutAvatarImageView, LayoutGridItem, LayoutGridItemProps } from '../../../../../common';
import { useCatalog, useInventoryFurni } from '../../../../../hooks';

interface CatalogGridOfferViewProps extends LayoutGridItemProps
{
    offer: IPurchasableOffer;
    selectOffer: (offer: IPurchasableOffer) => void;
}

const FAVORITES_KEY = 'nitro.catalog.favorites';
const RECENTS_KEY = 'nitro.catalog.recents';
const MAX_RECENTS = 20;

const readIds = (key: string): number[] =>
{
    try
    {
        const value = JSON.parse(localStorage.getItem(key) || '[]');

        return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
    }
    catch
    {
        return [];
    }
};

const writeIds = (key: string, ids: number[]) =>
{
    try
    {
        localStorage.setItem(key, JSON.stringify(ids));
    }
    catch
    {
        // localStorage indisponível.
    }
};

export const CatalogGridOfferView: FC<CatalogGridOfferViewProps> = props =>
{
    const { offer = null, selectOffer = null, itemActive = false, ...rest } = props;
    const [ isMouseDown, setMouseDown ] = useState(false);
    const [ isFavorite, setIsFavorite ] = useState(() => readIds(FAVORITES_KEY).includes(Number(offer?.offerId)));
    const { requestOfferToMover = null } = useCatalog();
    const { isVisible = false } = useInventoryFurni();

    const iconUrl = useMemo(() =>
    {
        if(offer.pricingModel === Offer.PRICING_MODEL_BUNDLE) return null;

        return offer.product.getIconUrl(offer);
    }, [ offer ]);

    const rememberRecent = () =>
    {
        const offerId = Number(offer.offerId);
        const recent = readIds(RECENTS_KEY).filter(id => id !== offerId);

        recent.unshift(offerId);

        writeIds(RECENTS_KEY, recent.slice(0, MAX_RECENTS));
        window.dispatchEvent(new Event('nitro-catalog-local-lists-changed'));
    };

    const toggleFavorite = (event: MouseEvent) =>
    {
        event.preventDefault();
        event.stopPropagation();

        const offerId = Number(offer.offerId);
        const favorites = readIds(FAVORITES_KEY);
        const exists = favorites.includes(offerId);
        const updated = exists ? favorites.filter(id => id !== offerId) : [ ...favorites, offerId ];

        writeIds(FAVORITES_KEY, updated);
        setIsFavorite(!exists);
        window.dispatchEvent(new Event('nitro-catalog-local-lists-changed'));
    };

    const onMouseEvent = (event: MouseEvent) =>
    {
        switch(event.type)
        {
            case MouseEventType.MOUSE_DOWN:
                selectOffer(offer);
                rememberRecent();
                setMouseDown(true);
                return;
            case MouseEventType.MOUSE_UP:
                setMouseDown(false);
                return;
            case MouseEventType.ROLL_OUT:
                if(!isMouseDown || !itemActive || !isVisible) return;

                requestOfferToMover(offer);
                return;
        }
    };

    const product = offer.product;

    if(!product) return null;

    const title = `${ offer.localizationName || product?.furnitureData?.name || 'Mobi' }${ isFavorite ? ' ★' : '' }`;

    return (
        <LayoutGridItem
            itemImage={ iconUrl }
            itemCount={ ((offer.pricingModel === Offer.PRICING_MODEL_MULTI) ? product.productCount : 1) }
            itemUniqueSoldout={ (product.uniqueLimitedItemSeriesSize && !product.uniqueLimitedItemsLeft) }
            itemUniqueNumber={ product.uniqueLimitedItemSeriesSize }
            itemActive={ itemActive }
            onMouseDown={ onMouseEvent }
            onMouseUp={ onMouseEvent }
            onMouseOut={ onMouseEvent }
            className="catalog-grid-offer-enhanced"
            title={ title }
            { ...rest }
        >
            <span
                className={ `catalog-grid-favorite ${ isFavorite ? 'active' : '' }` }
                onMouseDown={ toggleFavorite }
                title={ isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos' }
            >
                { isFavorite ? <FaStar /> : <FaRegStar /> }
            </span>

            { (offer.product.productType === ProductTypeEnum.ROBOT) &&
                <LayoutAvatarImageView figure={ offer.product.extraParam } headOnly={ true } direction={ 3 } /> }
        </LayoutGridItem>
    );
};
