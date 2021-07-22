import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

//-------------------------------------------------------------------------------------------------
//Definition of content of each user of array 'Subnets', according to cdk.json
interface ISubnetSpecification
{
	cidr_pub: string;
	cidr_pvt: string;
	nat_gtw: boolean;
}
//-------------------------------------------------------------------------------------------------
//StackProps extended to receive parameters from app
interface Cdk001StackProps extends cdk.StackProps
{
	EnvironmentName: string;
	CidrVPC: string;
	SubnetsConfig: Array<ISubnetSpecification>;
}
//-------------------------------------------------------------------------------------------------
export class Cdk001Stack extends cdk.Stack
{
	constructor(scope: cdk.App, id: string, props: Cdk001StackProps)
	{
		super(scope, id, props);

		//##################################################################################
		//Creating VPC...
		const resVPC = new ec2.CfnVPC(this, 'VPC',
			{	cidrBlock: props.CidrVPC,
				enableDnsHostnames: true,
				enableDnsSupport: true,
				tags: [
					{	key: "Name",
						value: props.EnvironmentName + '-vpc'
					},
				],
			}
		);

		//##################################################################################
		//Creating Internet Gateway...
		const resIGw = new ec2.CfnInternetGateway(this, 'InternetGateway');
		//... and Internet Gateway attachment to VPC
		const resIGwVpcAttach = new ec2.CfnVPCGatewayAttachment(this, 'InternetGatewayVpcAttach',
			{	vpcId: resVPC.ref,
				internetGatewayId: resIGw.ref,
			}
		);
		resIGwVpcAttach.addDependsOn(resVPC);
		resIGwVpcAttach.addDependsOn(resIGw);
		
		//##################################################################################
		//Creating Route Table for public traffic (one for all public subnets)...
		const resRouteTablePublic = new ec2.CfnRouteTable(this, 'RouteTablePub', { vpcId: resVPC.ref });
		resRouteTablePublic.addDependsOn(resVPC);
		//... and route in Route Table for Internet Gateway
		const resRouteTablePublicRoute = new ec2.CfnRoute(this, 'RouteTablePubRoute',
			{	routeTableId: resRouteTablePublic.ref,
				gatewayId: resIGw.ref,
				destinationCidrBlock: '0.0.0.0/0',
			}
		);
		resRouteTablePublicRoute.addDependsOn(resRouteTablePublic);
		resRouteTablePublicRoute.addDependsOn(resIGw);
		resRouteTablePublicRoute.addDependsOn(resIGwVpcAttach);

		//##################################################################################
		//Creating Network ACLs...
		const resNACLPublic = new ec2.CfnNetworkAcl(this, 'NACLPub', {vpcId: resVPC.ref});
		resNACLPublic.addDependsOn(resVPC);
		new ec2.CfnNetworkAclEntry(this, 'NACLPubInboundHTTP',
			{	networkAclId: resNACLPublic.ref,
				egress: false,
				ruleNumber: 100,
				ruleAction: 'allow',
				protocol: 6, //IANA code or -1 for 'All' (6=TCP)
				cidrBlock: '0.0.0.0/0',
				portRange: {from: 80, to: 80},
			}
		);
		new ec2.CfnNetworkAclEntry(this, 'NACLPubInboundHTTPS',
			{	networkAclId: resNACLPublic.ref,
				egress: false,
				ruleNumber: 110,
				ruleAction: 'allow',
				protocol: 6, //IANA code or -1 for 'All' (6=TCP)
				cidrBlock: '0.0.0.0/0',
				portRange: {from: 443, to: 443},
			}
		);
		new ec2.CfnNetworkAclEntry(this, 'NACLPubInboundEphemeral',
			{	networkAclId: resNACLPublic.ref,
				egress: false,
				ruleNumber: 120,
				ruleAction: 'allow',
				protocol: 6, //IANA code or -1 for 'All' (6=TCP)
				cidrBlock: '0.0.0.0/0',
				portRange: {from: 1024, to: 65535},
			}
		);
		new ec2.CfnNetworkAclEntry(this, 'NACLPubInboundSSH',
			{	networkAclId: resNACLPublic.ref,
				egress: false,
				ruleNumber: 130,
				ruleAction: 'allow',
				protocol: 6, //IANA code or -1 for 'All' (6=TCP)
				cidrBlock: '0.0.0.0/0',
				portRange: {from: 22, to: 22},
			}
		);
		//TODO: continuar...

		const resNACLPrivate = new ec2.CfnNetworkAcl(this, 'NACLPvt', {vpcId: resVPC.ref});
		resNACLPrivate.addDependsOn(resVPC);
		new ec2.CfnNetworkAclEntry(this, 'NACLPvtInboundAllInternalTraffic',
			{	networkAclId: resNACLPrivate.ref,
				egress: false,
				ruleNumber: 100,
				ruleAction: 'allow',
				protocol: -1, //IANA code or -1 for 'All'
				cidrBlock: props.CidrVPC,
			}
		);

		//##################################################################################
		//Creating subnets according to cdk.json configuration specification
		let subnetCounter:number = 1;
		for (let subnetSpec of props.SubnetsConfig)
		{
			//Create PUBLIC subnet of pair
			const resSubnetPub = new ec2.CfnSubnet(this, 'SubnetPub' + subnetCounter,
				{	vpcId: resVPC.ref,
					cidrBlock: subnetSpec['cidr_pub'],
					mapPublicIpOnLaunch: true,
					availabilityZone: cdk.Stack.of(this).availabilityZones[subnetCounter-1],
					tags: [
						{	key: "Name",
							value: props.EnvironmentName + '-pub' + subnetCounter
						},
					],
				}
			);
			resSubnetPub.addDependsOn(resVPC);

			//Create association of public subnet to RouteTablePub
			new ec2.CfnSubnetRouteTableAssociation(this, 'SubnetPub'+subnetCounter+'RouteTablePubAssoc',
				{	routeTableId: resRouteTablePublic.ref,
					subnetId: resSubnetPub.ref,
				}
			);

			//Create association of public subnet to NACLPublic
			new ec2.CfnSubnetNetworkAclAssociation(this, 'SubnetPub'+subnetCounter+'NACLPubAssoc',
				{	networkAclId: resNACLPublic.ref,
					subnetId: resSubnetPub.ref,
				}
			);

			//Create PRIVATE subnet of pair
			const resSubnetPvt = new ec2.CfnSubnet(this, 'SubnetPvt' + subnetCounter,
				{	vpcId: resVPC.ref,
					cidrBlock: subnetSpec['cidr_pvt'],
					mapPublicIpOnLaunch: false,
					availabilityZone: cdk.Stack.of(this).availabilityZones[subnetCounter-1],
					tags: [
						{	key: "Name",
							value: props.EnvironmentName + '-pvt' + subnetCounter
						},
					],
				}
			);
			resSubnetPvt.addDependsOn(resVPC);

			//Create NAT Gateway in public subnet (and respective EIP) for private subnet...
			const resNatEIP = new ec2.CfnEIP(this, 'NATGateway'+subnetCounter+'EIP', { domain: resVPC.ref });
			resNatEIP.addDependsOn(resVPC);

			const resNATGw = new ec2.CfnNatGateway(this, 'NATGateway'+subnetCounter,
				{	allocationId: resNatEIP.attrAllocationId, //.getAtt(AllocationId),
					subnetId: resSubnetPub.ref,
				}
			);
			resIGwVpcAttach.addDependsOn(resNatEIP);
			resIGwVpcAttach.addDependsOn(resSubnetPvt);

			//Creating Route Table for private traffic (one RT for each private subnet)...
			const resRouteTablePrivate = new ec2.CfnRouteTable(this, 'RouteTablePvt'+subnetCounter, { vpcId: resVPC.ref });
			resRouteTablePrivate.addDependsOn(resVPC);
			//... and route in Route Table for NAT Gateway
			const resRouteTablePrivateRoute = new ec2.CfnRoute(this, 'RouteTablePvt'+subnetCounter+'Route',
				{	routeTableId: resRouteTablePrivate.ref,
					natGatewayId: resNATGw.ref,
					destinationCidrBlock: '0.0.0.0/0',
				}
			);
			resRouteTablePrivateRoute.addDependsOn(resRouteTablePrivate);
			resRouteTablePrivateRoute.addDependsOn(resNATGw);

			//Create association of private subnet to RouteTablePvt
			new ec2.CfnSubnetRouteTableAssociation(this, 'SubnetPvt'+subnetCounter+'RouteTablePvt'+subnetCounter+'Assoc',
				{	routeTableId: resRouteTablePrivate.ref,
					subnetId: resSubnetPvt.ref,
				}
			);

			//Create association of private subnet to NACLPrivate
			new ec2.CfnSubnetNetworkAclAssociation(this, 'SubnetPvt'+subnetCounter+'NACLPvtAssoc',
				{	networkAclId: resNACLPrivate.ref,
					subnetId: resSubnetPvt.ref,
				}
			);

			subnetCounter++;
		}
	}

}