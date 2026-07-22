import { Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaSearchMinus, FaSearchPlus, FaUndo } from 'react-icons/fa';
import { FurniCategory, GetAvatarRenderManager, GetSessionDataManager, Offer, ProductTypeEnum } from '../../../../../api';
import { AutoGrid, Button, Column, Flex, LayoutGridItem, LayoutRoomPreviewerView, Text } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';

const ROTATIONS = [ 0, 90, 180, 270 ];
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.50;
const ZOOM_STEP = 0.15;

export const CatalogViewProductWidgetView: FC<{}> = () =>
{
    const { currentOffer = null, roomPreviewer = null, purchaseOptions = null } = useCatalog();
    const { previewStuffData = null } = purchaseOptions;
    const [ rotationIndex, setRotationIndex ] = useState(1);
    const [ zoom, setZoom ] = useState(1);

    const rotation = ROTATIONS[rotationIndex];

    useEffect(() =>
    {
        setRotationIndex(1);
        setZoom(1);
    }, [ currentOffer ]);

    useEffect(() =>
    {
        if(!currentOffer || (currentOffer.pricingModel === Offer.PRICING_MODEL_BUNDLE) || !roomPreviewer) return;

        const product = currentOffer.product;

        if(!product) return;

        roomPreviewer.reset(false);

        switch(product.productType)
        {
            case ProductTypeEnum.FLOOR:
            {
                if(!product.furnitureData) return;

                if(product.furnitureData.specialType === FurniCategory.FIGURE_PURCHASABLE_SET)
                {
                    const furniData = GetSessionDataManager().getFloorItemData(product.furnitureData.id);
                    const customParts = furniData.customParams.split(',').map(value => parseInt(value));
                    const figureSets: number[] = [];

                    for(const part of customParts)
                    {
                        if(GetAvatarRenderManager().isValidFigureSetForGender(part, GetSessionDataManager().gender)) figureSets.push(part);
                    }

                    const figureString = GetAvatarRenderManager().getFigureStringWithFigureIds(GetSessionDataManager().figure, GetSessionDataManager().gender, figureSets);

                    roomPreviewer.addAvatarIntoRoom(figureString, product.productClassId);
                }
                else
                {
                    roomPreviewer.addFurnitureIntoRoom(product.productClassId, new Vector3d(rotation), previewStuffData, product.extraParam);
                }
                return;
            }
            case ProductTypeEnum.WALL:
            {
                if(!product.furnitureData) return;

                switch(product.furnitureData.specialType)
                {
                    case FurniCategory.FLOOR:
                        roomPreviewer.updateObjectRoom(product.extraParam);
                        return;
                    case FurniCategory.WALL_PAPER:
                        roomPreviewer.updateObjectRoom(null, product.extraParam);
                        return;
                    case FurniCategory.LANDSCAPE:
                    {
                        roomPreviewer.updateObjectRoom(null, null, product.extraParam);

                        const furniData = GetSessionDataManager().getWallItemDataByName('window_double_default');

                        if(furniData) roomPreviewer.addWallItemIntoRoom(furniData.id, new Vector3d(rotation), furniData.customParams);
                        return;
                    }
                    default:
                        roomPreviewer.updateObjectRoom('default', 'default', 'default');
                        roomPreviewer.addWallItemIntoRoom(product.productClassId, new Vector3d(rotation), product.extraParam);
                        return;
                }
            }
            case ProductTypeEnum.ROBOT:
                roomPreviewer.addAvatarIntoRoom(product.extraParam, 0);
                return;
            case ProductTypeEnum.EFFECT:
                roomPreviewer.addAvatarIntoRoom(GetSessionDataManager().figure, product.productClassId);
                return;
        }
    }, [ currentOffer, previewStuffData, roomPreviewer, rotation ]);

    if(!currentOffer) return null;

    if(currentOffer.pricingModel === Offer.PRICING_MODEL_BUNDLE)
    {
        return (
            <Column fit overflow="hidden" className="bg-muted p-2 rounded">
                <AutoGrid fullWidth columnCount={ 4 } className="nitro-catalog-layout-bundle-grid">
                    { (currentOffer.products.length > 0) && currentOffer.products.map((product, index) =>
                    {
                        return <LayoutGridItem key={ index } itemImage={ product.getIconUrl(currentOffer) } itemCount={ product.productCount } />;
                    }) }
                </AutoGrid>
            </Column>
        );
    }

    const canRotate = (currentOffer.product.productType === ProductTypeEnum.FLOOR) || (currentOffer.product.productType === ProductTypeEnum.WALL);

    return (
        <Column fullWidth gap={ 1 } className="catalog-product-preview-enhanced">
            <Flex center fullWidth className="catalog-product-preview-stage">
                <div
                    className="catalog-product-preview-zoom"
                    style={ {
                        transform: `scale(${ zoom })`,
                        transition: 'transform 120ms ease'
                    } }
                >
                    <LayoutRoomPreviewerView roomPreviewer={ roomPreviewer } height={ 210 } />
                </div>
            </Flex>

            <Flex center alignItems="center" gap={ 1 } className="catalog-product-preview-controls">
                <Button
                    variant="secondary"
                    disabled={ !canRotate }
                    onClick={ () => setRotationIndex(value => (value + ROTATIONS.length - 1) % ROTATIONS.length) }
                    title="Girar para a esquerda"
                >
                    <FaChevronLeft className="fa-icon" />
                </Button>

                <Button
                    variant="secondary"
                    disabled={ !canRotate }
                    onClick={ () => setRotationIndex(value => (value + 1) % ROTATIONS.length) }
                    title="Girar para a direita"
                >
                    <FaChevronRight className="fa-icon" />
                </Button>

                <Button
                    variant="secondary"
                    disabled={ zoom <= MIN_ZOOM }
                    onClick={ () => setZoom(value => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2)))) }
                    title="Diminuir zoom"
                >
                    <FaSearchMinus className="fa-icon" />
                </Button>

                <Text small className="catalog-product-preview-zoom-label">
                    { Math.round(zoom * 100) }%
                </Text>

                <Button
                    variant="secondary"
                    disabled={ zoom >= MAX_ZOOM }
                    onClick={ () => setZoom(value => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2)))) }
                    title="Aumentar zoom"
                >
                    <FaSearchPlus className="fa-icon" />
                </Button>

                <Button
                    variant="secondary"
                    onClick={ () =>
                    {
                        setRotationIndex(1);
                        setZoom(1);
                    } }
                    title="Restaurar visualização"
                >
                    <FaUndo className="fa-icon" />
                </Button>
            </Flex>
        </Column>
    );
};
