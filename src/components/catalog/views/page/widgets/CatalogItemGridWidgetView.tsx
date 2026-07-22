import { FC, useEffect, useRef, useState } from 'react';
import { IPurchasableOffer, ProductTypeEnum } from '../../../../../api';
import { AutoGrid, AutoGridProps } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { CatalogGridOfferView } from '../common/CatalogGridOfferView';

interface CatalogItemGridWidgetViewProps extends AutoGridProps
{
}

const getResponsiveColumnCount = (width: number) =>
{
    if(width >= 760) return 7;
    if(width >= 620) return 6;
    if(width >= 470) return 5;
    if(width >= 350) return 4;

    return 3;
};

export const CatalogItemGridWidgetView: FC<CatalogItemGridWidgetViewProps> = props =>
{
    const { columnCount = null, children = null, ...rest } = props;
    const { currentOffer = null, setCurrentOffer = null, currentPage = null, setPurchaseOptions = null } = useCatalog();
    const elementRef = useRef<HTMLDivElement>();
    const [ responsiveColumns, setResponsiveColumns ] = useState(5);

    useEffect(() =>
    {
        if(elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [ currentPage ]);

    useEffect(() =>
    {
        const element = elementRef.current;

        if(!element || columnCount) return;

        const updateColumns = () => setResponsiveColumns(getResponsiveColumnCount(element.clientWidth));

        updateColumns();

        if(typeof ResizeObserver === 'undefined')
        {
            window.addEventListener('resize', updateColumns);

            return () => window.removeEventListener('resize', updateColumns);
        }

        const observer = new ResizeObserver(updateColumns);

        observer.observe(element);

        return () => observer.disconnect();
    }, [ columnCount ]);

    if(!currentPage) return null;

    const selectOffer = (offer: IPurchasableOffer) =>
    {
        offer.activate();

        if(offer.isLazy) return;

        setCurrentOffer(offer);

        if(offer.product && (offer.product.productType === ProductTypeEnum.WALL))
        {
            setPurchaseOptions(prevValue =>
            {
                const newValue = { ...prevValue };

                newValue.extraData = (offer.product.extraParam || null);

                return newValue;
            });
        }
    };

    return (
        <AutoGrid
            innerRef={ elementRef }
            columnCount={ columnCount || responsiveColumns }
            className="catalog-responsive-item-grid"
            { ...rest }
        >
            { currentPage.offers && (currentPage.offers.length > 0) && currentPage.offers.map((offer, index) =>
                <CatalogGridOfferView
                    key={ index }
                    itemActive={ !!(currentOffer && (currentOffer.offerId === offer.offerId)) }
                    offer={ offer }
                    selectOffer={ selectOffer }
                />) }
            { children }
        </AutoGrid>
    );
};
