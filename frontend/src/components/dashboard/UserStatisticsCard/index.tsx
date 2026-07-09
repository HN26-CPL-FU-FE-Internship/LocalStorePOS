import SectionCard from "../../common/SectionCard";
import AvatarStack from "../../common/AvatarStack";
import ChartPlaceholder from "../../common/ChartPlaceholder";
import Icon from "../../common/Icon";
import type { AvatarStackItem } from "../../../types";

export interface UserStatisticsCardProps {
  topUser: {
    name: string;
    avatarUrl: string;
    grandTotal: string;
    totalNewUsers: string;
    newUsersChange: string;
  };
  newUserAvatars: AvatarStackItem[];
}

const UserStatisticsCard = ({ topUser, newUserAvatars }: UserStatisticsCardProps) => (
  <SectionCard
    icon="users-round"
    title="User Statistics"
    bodyClassName="d-flex flex-column pb-0"
    filterOptions={[{ label: "Weekly" }, { label: "Monthly" }, { label: "Yearly" }]}
    activeFilterLabel="Weekly"
  >
    <div className="d-flex align-items-center justify-content-between border-bottom mb-4 pb-4 flex-sm-row flex-wrap gap-2">
      <div className="d-flex align-items-center">
        <div className="avatar avatar-xxl avatar-rounded flex-shrink-0 border me-2">
          <img src={topUser.avatarUrl} alt="user" className="img-fluid" />
        </div>
        <div>
          <p className="fs-13 text-dark mb-1">Top User</p>
          <h6 className="mb-0">{topUser.name}</h6>
        </div>
      </div>
      <div>
        <p className="fs-13 text-dark mb-1">Grand Total</p>
        <h6 className="mb-0">{topUser.grandTotal}</h6>
      </div>
    </div>

    <div className="d-flex align-items-center justify-content-between">
      <div>
        <p className="mb-1">Total New Users</p>
        <h6 className="mb-0">
          {topUser.totalNewUsers}
          <span className="d-inline-flex align-items-center text-success fs-13 fw-medium ms-1">
            <Icon name="circle-arrow-up" className="me-1" />
            {topUser.newUsersChange}
          </span>
        </h6>
      </div>
      <AvatarStack items={newUserAvatars} />
    </div>

    <ChartPlaceholder id="statistic-chart" height={160} className="mt-auto" />
  </SectionCard>
);

export default UserStatisticsCard;
