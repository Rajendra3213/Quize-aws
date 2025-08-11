from database import SessionLocal, Question

def seed_aws_questions():
    db = SessionLocal()
    
    # Clear existing questions first
    db.query(Question).delete()
    
    questions = [
        {
            "text": "What does AWS stand for?",
            "option_a": "Amazon Web Services",
            "option_b": "Amazon World Services",
            "option_c": "Amazon Wide Services",
            "option_d": "Amazon Web Solutions",
            "correct_answer": "A"
        },
        {
            "text": "Which AWS service is used for object storage?",
            "option_a": "EC2",
            "option_b": "S3",
            "option_c": "RDS",
            "option_d": "Lambda",
            "correct_answer": "B"
        },
        {
            "text": "What is the default storage class in Amazon S3?",
            "option_a": "Standard-IA",
            "option_b": "Glacier",
            "option_c": "Standard",
            "option_d": "Reduced Redundancy",
            "correct_answer": "C"
        },
        {
            "text": "Which service provides virtual servers in AWS?",
            "option_a": "S3",
            "option_b": "EC2",
            "option_c": "Lambda",
            "option_d": "CloudFront",
            "correct_answer": "B"
        },
        {
            "text": "What does RDS stand for?",
            "option_a": "Relational Database Service",
            "option_b": "Remote Database Service",
            "option_c": "Rapid Database Service",
            "option_d": "Real Database Service",
            "correct_answer": "A"
        },
        {
            "text": "Which AWS service is used for content delivery?",
            "option_a": "S3",
            "option_b": "EC2",
            "option_c": "CloudFront",
            "option_d": "Route 53",
            "correct_answer": "C"
        },
        {
            "text": "What is AWS Lambda?",
            "option_a": "A database service",
            "option_b": "A serverless compute service",
            "option_c": "A storage service",
            "option_d": "A networking service",
            "correct_answer": "B"
        },
        {
            "text": "Which service is used for DNS in AWS?",
            "option_a": "CloudFront",
            "option_b": "Route 53",
            "option_c": "VPC",
            "option_d": "ELB",
            "correct_answer": "B"
        },
        {
            "text": "What does VPC stand for?",
            "option_a": "Virtual Private Cloud",
            "option_b": "Virtual Public Cloud",
            "option_c": "Virtual Private Connection",
            "option_d": "Virtual Public Connection",
            "correct_answer": "A"
        },
        {
            "text": "Which AWS service provides managed NoSQL database?",
            "option_a": "RDS",
            "option_b": "DynamoDB",
            "option_c": "Redshift",
            "option_d": "Aurora",
            "correct_answer": "B"
        },
        {
            "text": "Which service is used for monitoring AWS resources?",
            "option_a": "CloudTrail",
            "option_b": "CloudWatch",
            "option_c": "Config",
            "option_d": "Inspector",
            "correct_answer": "B"
        },
        {
            "text": "What does IAM stand for?",
            "option_a": "Identity and Access Management",
            "option_b": "Internet Access Management",
            "option_c": "Internal Access Management",
            "option_d": "Identity and Authorization Management",
            "correct_answer": "A"
        },
        {
            "text": "Which AWS service provides data warehousing?",
            "option_a": "RDS",
            "option_b": "DynamoDB",
            "option_c": "Redshift",
            "option_d": "Aurora",
            "correct_answer": "C"
        },
        {
            "text": "Which service provides elastic load balancing?",
            "option_a": "ELB",
            "option_b": "Auto Scaling",
            "option_c": "CloudFront",
            "option_d": "Route 53",
            "correct_answer": "A"
        },
        {
            "text": "Which storage class is cheapest for long-term archival?",
            "option_a": "S3 Standard",
            "option_b": "S3 IA",
            "option_c": "Glacier Deep Archive",
            "option_d": "Glacier",
            "correct_answer": "C"
        },
        {
            "text": "What does EBS stand for?",
            "option_a": "Elastic Block Store",
            "option_b": "Elastic Block Service",
            "option_c": "Elastic Backup Store",
            "option_d": "Elastic Backup Service",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for API management?",
            "option_a": "Lambda",
            "option_b": "API Gateway",
            "option_c": "CloudFront",
            "option_d": "Route 53",
            "correct_answer": "B"
        },
        {
            "text": "Which service provides container orchestration?",
            "option_a": "ECS",
            "option_b": "EC2",
            "option_c": "Lambda",
            "option_d": "Batch",
            "correct_answer": "A"
        },
        {
            "text": "What does SNS stand for?",
            "option_a": "Simple Notification Service",
            "option_b": "Simple Network Service",
            "option_c": "Secure Notification Service",
            "option_d": "Secure Network Service",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for message queuing?",
            "option_a": "SNS",
            "option_b": "SQS",
            "option_c": "SES",
            "option_d": "SWF",
            "correct_answer": "B"
        },
        {
            "text": "Which service provides managed Kubernetes?",
            "option_a": "ECS",
            "option_b": "EKS",
            "option_c": "Fargate",
            "option_d": "Batch",
            "correct_answer": "B"
        },
        {
            "text": "What does SES stand for?",
            "option_a": "Simple Email Service",
            "option_b": "Secure Email Service",
            "option_c": "Simple Elastic Service",
            "option_d": "Secure Elastic Service",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for code deployment?",
            "option_a": "CodeCommit",
            "option_b": "CodeBuild",
            "option_c": "CodeDeploy",
            "option_d": "CodePipeline",
            "correct_answer": "C"
        },
        {
            "text": "Which service provides managed Apache Spark?",
            "option_a": "EMR",
            "option_b": "Glue",
            "option_c": "Kinesis",
            "option_d": "Data Pipeline",
            "correct_answer": "A"
        },
        {
            "text": "What does CloudTrail log?",
            "option_a": "Application logs",
            "option_b": "API calls",
            "option_c": "Performance metrics",
            "option_d": "Error logs",
            "correct_answer": "B"
        },
        {
            "text": "Which service is used for real-time data streaming?",
            "option_a": "SQS",
            "option_b": "SNS",
            "option_c": "Kinesis",
            "option_d": "Data Pipeline",
            "correct_answer": "C"
        },
        {
            "text": "Which service provides managed Redis?",
            "option_a": "RDS",
            "option_b": "ElastiCache",
            "option_c": "DynamoDB",
            "option_d": "DocumentDB",
            "correct_answer": "B"
        },
        {
            "text": "What does Auto Scaling monitor by default?",
            "option_a": "CPU utilization",
            "option_b": "Memory utilization",
            "option_c": "Network utilization",
            "option_d": "Disk utilization",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for machine learning?",
            "option_a": "SageMaker",
            "option_b": "Comprehend",
            "option_c": "Rekognition",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "Which service provides managed blockchain?",
            "option_a": "Blockchain",
            "option_b": "Managed Blockchain",
            "option_c": "Quantum Ledger Database",
            "option_d": "Both B and C",
            "correct_answer": "D"
        },
        {
            "text": "What does WAF stand for?",
            "option_a": "Web Application Firewall",
            "option_b": "Web Access Framework",
            "option_c": "Web Application Framework",
            "option_d": "Web Access Firewall",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for secrets management?",
            "option_a": "KMS",
            "option_b": "Secrets Manager",
            "option_c": "Parameter Store",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "Which service provides managed Apache Kafka?",
            "option_a": "Kinesis",
            "option_b": "MSK",
            "option_c": "SQS",
            "option_d": "EventBridge",
            "correct_answer": "B"
        },
        {
            "text": "What does EFS stand for?",
            "option_a": "Elastic File System",
            "option_b": "Elastic File Service",
            "option_c": "Extended File System",
            "option_d": "Extended File Service",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for hybrid cloud storage?",
            "option_a": "Storage Gateway",
            "option_b": "DataSync",
            "option_c": "Direct Connect",
            "option_d": "VPN",
            "correct_answer": "A"
        },
        {
            "text": "Which service provides managed GraphQL APIs?",
            "option_a": "API Gateway",
            "option_b": "AppSync",
            "option_c": "Lambda",
            "option_d": "Amplify",
            "correct_answer": "B"
        },
        {
            "text": "What does GuardDuty provide?",
            "option_a": "Threat detection",
            "option_b": "Compliance monitoring",
            "option_c": "Performance monitoring",
            "option_d": "Cost optimization",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for disaster recovery?",
            "option_a": "Backup",
            "option_b": "DRS",
            "option_c": "CloudEndure",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "Which service provides managed time series database?",
            "option_a": "RDS",
            "option_b": "DynamoDB",
            "option_c": "Timestream",
            "option_d": "DocumentDB",
            "correct_answer": "C"
        },
        {
            "text": "What does CDN stand for?",
            "option_a": "Content Delivery Network",
            "option_b": "Cloud Data Network",
            "option_c": "Central Distribution Network",
            "option_d": "Content Distribution Node",
            "correct_answer": "A"
        },
        {
            "text": "Which AWS service is used for container registry?",
            "option_a": "ECS",
            "option_b": "ECR",
            "option_c": "EKS",
            "option_d": "Fargate",
            "correct_answer": "B"
        },
        {
            "text": "Which service provides managed Apache Airflow?",
            "option_a": "Data Pipeline",
            "option_b": "Glue",
            "option_c": "MWAA",
            "option_d": "Step Functions",
            "correct_answer": "C"
        },
        {
            "text": "What does CORS stand for?",
            "option_a": "Cross-Origin Resource Sharing",
            "option_b": "Cloud Origin Resource Service",
            "option_c": "Central Origin Request System",
            "option_d": "Cross-Origin Request Security",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for AWS cost management?",
            "option_a": "Cost Explorer",
            "option_b": "Budgets",
            "option_c": "Cost and Usage Report",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "Which service provides managed Elasticsearch?",
            "option_a": "CloudSearch",
            "option_b": "OpenSearch",
            "option_c": "Kendra",
            "option_d": "Comprehend",
            "correct_answer": "B"
        },
        {
            "text": "What does AMI stand for?",
            "option_a": "Amazon Machine Image",
            "option_b": "Amazon Memory Instance",
            "option_c": "Amazon Machine Instance",
            "option_d": "Amazon Memory Image",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for AWS resource tagging?",
            "option_a": "Resource Groups",
            "option_b": "Tag Editor",
            "option_c": "Config",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "Which service provides managed MongoDB?",
            "option_a": "DynamoDB",
            "option_b": "DocumentDB",
            "option_c": "RDS",
            "option_d": "Neptune",
            "correct_answer": "B"
        },
        {
            "text": "What does NAT stand for?",
            "option_a": "Network Address Translation",
            "option_b": "Network Access Terminal",
            "option_c": "Network Application Transfer",
            "option_d": "Network Address Transfer",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for AWS compliance reporting?",
            "option_a": "Config",
            "option_b": "Artifact",
            "option_c": "Inspector",
            "option_d": "Security Hub",
            "correct_answer": "B"
        },
        {
            "text": "Which service provides managed Apache Cassandra?",
            "option_a": "DynamoDB",
            "option_b": "Keyspaces",
            "option_c": "DocumentDB",
            "option_d": "Neptune",
            "correct_answer": "B"
        },
        {
            "text": "What does TTL stand for in DynamoDB?",
            "option_a": "Time To Live",
            "option_b": "Total Transaction Limit",
            "option_c": "Table Transfer Limit",
            "option_d": "Time To Load",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for AWS network monitoring?",
            "option_a": "VPC Flow Logs",
            "option_b": "CloudWatch",
            "option_c": "X-Ray",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "What is AWS Organizations used for?",
            "option_a": "Managing multiple AWS accounts",
            "option_b": "User authentication",
            "option_c": "Resource monitoring",
            "option_d": "Cost optimization",
            "correct_answer": "A"
        },
        {
            "text": "Which service provides managed graph database?",
            "option_a": "DynamoDB",
            "option_b": "Neptune",
            "option_c": "DocumentDB",
            "option_d": "RDS",
            "correct_answer": "B"
        },
        {
            "text": "Which AWS service is used for serverless application deployment?",
            "option_a": "Lambda",
            "option_b": "SAM",
            "option_c": "Serverless Application Repository",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "What is AWS Fargate?",
            "option_a": "A container orchestration service",
            "option_b": "A serverless compute engine for containers",
            "option_c": "A container registry",
            "option_d": "A container monitoring service",
            "correct_answer": "B"
        },
        {
            "text": "Which service is used for AWS resource inventory?",
            "option_a": "Config",
            "option_b": "Systems Manager",
            "option_c": "Resource Groups",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "What does AWS Step Functions provide?",
            "option_a": "Workflow orchestration",
            "option_b": "Function deployment",
            "option_c": "API management",
            "option_d": "Container orchestration",
            "correct_answer": "A"
        },
        {
            "text": "Which service is used for AWS application performance monitoring?",
            "option_a": "CloudWatch",
            "option_b": "X-Ray",
            "option_c": "Application Insights",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "What is AWS Amplify used for?",
            "option_a": "Mobile app development",
            "option_b": "Web app development",
            "option_c": "Full-stack application deployment",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "Which service provides AWS managed certificates?",
            "option_a": "Certificate Manager",
            "option_b": "KMS",
            "option_c": "Secrets Manager",
            "option_d": "IAM",
            "correct_answer": "A"
        },
        {
            "text": "What is AWS CloudFormation used for?",
            "option_a": "Infrastructure as Code",
            "option_b": "Application deployment",
            "option_c": "Resource provisioning",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "Which service is used for AWS data migration?",
            "option_a": "DataSync",
            "option_b": "Database Migration Service",
            "option_c": "Snow Family",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "What does AWS Trusted Advisor provide?",
            "option_a": "Security recommendations",
            "option_b": "Cost optimization suggestions",
            "option_c": "Performance insights",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "Which service is used for AWS event-driven architecture?",
            "option_a": "EventBridge",
            "option_b": "SNS",
            "option_c": "SQS",
            "option_d": "All of the above",
            "correct_answer": "D"
        },
        {
            "text": "What is AWS Well-Architected Framework?",
            "option_a": "A set of best practices",
            "option_b": "A deployment tool",
            "option_c": "A monitoring service",
            "option_d": "A security framework",
            "correct_answer": "A"
        }
    ]
    
    for q_data in questions:
        question = Question(**q_data)
        db.add(question)
    
    db.commit()
    db.close()
    print("70 unique AWS questions seeded successfully!")

if __name__ == "__main__":
    seed_aws_questions()