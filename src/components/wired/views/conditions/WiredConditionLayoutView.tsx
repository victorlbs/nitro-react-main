import { WiredConditionlayout } from '../../../../api';
import { WiredConditionActorHasHandItemView } from './WiredConditionActorHasHandItem';
import { WiredConditionActorIsGroupMemberView } from './WiredConditionActorIsGroupMemberView';
import { WiredConditionActorIsOnFurniView } from './WiredConditionActorIsOnFurniView';
import { WiredConditionActorIsTeamMemberView } from './WiredConditionActorIsTeamMemberView';
import { WiredConditionActorIsWearingBadgeView } from './WiredConditionActorIsWearingBadgeView';
import { WiredConditionActorIsWearingEffectView } from './WiredConditionActorIsWearingEffectView';
import { WiredConditionDateMatchView } from './WiredConditionDateMatchView';
import { WiredConditionDateRangeView } from './WiredConditionDateRangeView';
import { WiredConditionFurniHasAvatarOnView } from './WiredConditionFurniHasAvatarOnView';
import { WiredConditionFurniHasFurniOnView } from './WiredConditionFurniHasFurniOnView';
import { WiredConditionFurniHasNotFurniOnView } from './WiredConditionFurniHasNotFurniOnView';
import { WiredConditionFurniHeightCompareView } from './WiredConditionFurniHeightCompareView';
import { WiredConditionFurniInAreaView } from './WiredConditionFurniInAreaView';
import { WiredConditionFurniIsOfTypeView } from './WiredConditionFurniIsOfTypeView';
import { WiredConditionFurniMatchesSnapshotView } from './WiredConditionFurniMatchesSnapshotView';
import { WiredConditionHabboDirectionMultiView } from './WiredConditionHabboDirectionMultiView';
import { WiredConditionSelectorHabbosByNameView } from './WiredConditionSelectorHabbosByNameView';
import { WiredConditionSelectorHabbosGroupView } from './WiredConditionSelectorHabbosGroupView';
import { WiredConditionSelectQuantityView } from './WiredConditionSelectQuantityView';
import { WiredConditionTeamScoreCompareView } from './WiredConditionTeamScoreCompareView';
import { WiredConditionTimeCoincideView } from './WiredConditionTimeCoincideView';
import { WiredConditionTimeElapsedLessView } from './WiredConditionTimeElapsedLessView';
import { WiredConditionTimeElapsedMoreView } from './WiredConditionTimeElapsedMoreView';
import { WiredConditionUserCountInRoomView } from './WiredConditionUserCountInRoomView';
import { WiredConditionVariableFromOtherRoomView } from './WiredConditionVariableFromOtherRoomView';
import { WiredConditionHabboOnFurniView } from './WiredConditionHabboOnFurniView';
import { WiredConditionFurniInNeighbourhoodView } from './WiredConditionFurniInNeighbourhoodView';


export const WiredConditionLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredConditionlayout.ACTOR_HAS_HANDITEM:
            return <WiredConditionActorHasHandItemView />;
        case WiredConditionlayout.ACTOR_IS_GROUP_MEMBER:
        case WiredConditionlayout.NOT_ACTOR_IN_GROUP:
            return <WiredConditionActorIsGroupMemberView />;
        case WiredConditionlayout.ACTOR_IS_ON_FURNI:
        case WiredConditionlayout.NOT_ACTOR_ON_FURNI:
            return <WiredConditionActorIsOnFurniView />;
        case WiredConditionlayout.ACTOR_IS_IN_TEAM:
        case WiredConditionlayout.NOT_ACTOR_IN_TEAM:
            return <WiredConditionActorIsTeamMemberView />;
        case WiredConditionlayout.ACTOR_IS_WEARING_BADGE:
        case WiredConditionlayout.NOT_ACTOR_WEARS_BADGE:
            return <WiredConditionActorIsWearingBadgeView />;
        case WiredConditionlayout.ACTOR_IS_WEARING_EFFECT:
        case WiredConditionlayout.NOT_ACTOR_WEARING_EFFECT:
            return <WiredConditionActorIsWearingEffectView />;
        case WiredConditionlayout.DATE_RANGE_ACTIVE:
            return <WiredConditionDateRangeView />;
        case WiredConditionlayout.FURNIS_HAVE_AVATARS:
        case WiredConditionlayout.FURNI_NOT_HAVE_HABBO:
            return <WiredConditionFurniHasAvatarOnView />;
        case WiredConditionlayout.HAS_STACKED_FURNIS:
            return <WiredConditionFurniHasFurniOnView />;
        case WiredConditionlayout.NOT_HAS_STACKED_FURNIS:
            return <WiredConditionFurniHasNotFurniOnView />;
        case WiredConditionlayout.STUFF_TYPE_MATCHES:
        case WiredConditionlayout.NOT_FURNI_IS_OF_TYPE:
            return <WiredConditionFurniIsOfTypeView />;
        case WiredConditionlayout.STATES_MATCH:
        case WiredConditionlayout.NOT_STATES_MATCH:
            return <WiredConditionFurniMatchesSnapshotView />;
        case WiredConditionlayout.TIME_ELAPSED_LESS:
            return <WiredConditionTimeElapsedLessView />;
        case WiredConditionlayout.TIME_ELAPSED_MORE:
            return <WiredConditionTimeElapsedMoreView />;
        case WiredConditionlayout.USER_COUNT_IN:
        case WiredConditionlayout.NOT_USER_COUNT_IN:
            return <WiredConditionUserCountInRoomView />;
            

                 case WiredConditionlayout.SELECTOR_HABBOS_BY_NAME:
            return <WiredConditionSelectorHabbosByNameView />;
               case WiredConditionlayout.SELECTOR_HABBOS_IN_GROUP:
            return <WiredConditionSelectorHabbosGroupView />;

                case WiredConditionlayout.VARIABLE_OTHER_ROOM:
            return <WiredConditionVariableFromOtherRoomView />;

                            case WiredConditionlayout.DATE_MATCH:
            return <WiredConditionDateMatchView />;

                  case WiredConditionlayout.USER_COUNT_IN_ROOM:
            return <WiredConditionUserCountInRoomView />;

              case WiredConditionlayout.FURNI_HEIGHT_COMPARE:
            return <WiredConditionFurniHeightCompareView />;

                case WiredConditionlayout.HABBO_ON_FURNI:
            return <WiredConditionHabboOnFurniView />;

           case WiredConditionlayout.FURNI_IN_NEIGHBOURHOOD:
            return <WiredConditionFurniInNeighbourhoodView />;


        // Custom wired condition: time coincidence
        case WiredConditionlayout.TIME_COINCIDE:
            return <WiredConditionTimeCoincideView />;

        // Custom wired condition: furni in area
        case WiredConditionlayout.FURNI_IN_AREA:
            return <WiredConditionFurniInAreaView />;
               case WiredConditionlayout.TEAM_SCORE_COMPARE:
            return <WiredConditionTeamScoreCompareView />;
                case WiredConditionlayout.ACTOR_DIRECTION_MULTI:
            return <WiredConditionHabboDirectionMultiView />;
            case WiredConditionlayout.SELECT_QUANTITY:
            return <WiredConditionSelectQuantityView />;
    }

    return null;
}
