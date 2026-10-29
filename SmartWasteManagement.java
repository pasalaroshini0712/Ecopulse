import java.util.ArrayList;
import java.util.Scanner;

class WasteRequest {
    int id;
    String location;
    String wasteType;
    String status;

    WasteRequest(int id, String location, String wasteType) {
        this.id = id;
        this.location = location;
        this.wasteType = wasteType;
        this.status = "Pending";
    }

    void display() {
        System.out.println("Request ID : " + id);
        System.out.println("Location   : " + location);
        System.out.println("Waste Type : " + wasteType);
        System.out.println("Status     : " + status);
        System.out.println("----------------------------");
    }
}

class WasteBin {
    int binId;
    String location;
    int fillLevel;

    WasteBin(int binId, String location, int fillLevel) {
        this.binId = binId;
        this.location = location;
        this.fillLevel = fillLevel;
    }

    void display() {
        System.out.println("Bin ID     : " + binId);
        System.out.println("Location   : " + location);
        System.out.println("Fill Level : " + fillLevel + "%");

        if (fillLevel >= 80) {
            System.out.println("Alert      : Bin needs collection!");
        } else {
            System.out.println("Alert      : Bin capacity normal.");
        }

        System.out.println("----------------------------");
    }
}

public class SmartWasteManagement {
    static Scanner sc = new Scanner(System.in);

    static ArrayList<WasteRequest> requests = new ArrayList<>();
    static ArrayList<WasteBin> bins = new ArrayList<>();
    static ArrayList<String> complaints = new ArrayList<>();

    static int nextRequestId = 1;
    static int nextBinId = 1;

    static int readNumber(String message) {
        while (true) {
            System.out.print(message);
            try {
                int number = Integer.parseInt(sc.nextLine());
                return number;
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid number.");
            }
        }
    }

    static void addRequest() {
        System.out.print("Enter location: ");
        String location = sc.nextLine();

        System.out.print("Enter waste type (Wet/Dry/Plastic/E-Waste): ");
        String wasteType = sc.nextLine();

        WasteRequest request =
                new WasteRequest(nextRequestId++, location, wasteType);

        requests.add(request);

        System.out.println("Collection request added successfully!");
        System.out.println("Your Request ID is: " + request.id);
    }

    static void viewRequests() {
        if (requests.isEmpty()) {
            System.out.println("No collection requests found.");
            return;
        }

        for (WasteRequest request : requests) {
            request.display();
        }
    }

    static void searchRequest() {
        int id = readNumber("Enter request ID: ");

        for (WasteRequest request : requests) {
            if (request.id == id) {
                request.display();
                return;
            }
        }

        System.out.println("Request not found.");
    }

    static void updateStatus() {
        int id = readNumber("Enter request ID: ");

        for (WasteRequest request : requests) {
            if (request.id == id) {
                System.out.println("1. Pending");
                System.out.println("2. In Progress");
                System.out.println("3. Collected");

                int choice = readNumber("Choose new status: ");

                switch (choice) {
                    case 1:
                        request.status = "Pending";
                        break;
                    case 2:
                        request.status = "In Progress";
                        break;
                    case 3:
                        request.status = "Collected";
                        break;
                    default:
                        System.out.println("Invalid status choice.");
                        return;
                }

                System.out.println("Request status updated successfully!");
                return;
            }
        }

        System.out.println("Request not found.");
    }

    static void addBin() {
        System.out.print("Enter bin location: ");
        String location = sc.nextLine();

        int level = readNumber("Enter fill level (0-100): ");

        if (level < 0 || level > 100) {
            System.out.println("Fill level must be between 0 and 100.");
            return;
        }

        bins.add(new WasteBin(nextBinId++, location, level));
        System.out.println("Waste bin added successfully!");
    }

    static void viewBins() {
        if (bins.isEmpty()) {
            System.out.println("No waste bins registered.");
            return;
        }

        for (WasteBin bin : bins) {
            bin.display();
        }
    }

    static void registerComplaint() {
        System.out.print("Enter complaint location: ");
        String location = sc.nextLine();

        System.out.print("Describe the problem: ");
        String problem = sc.nextLine();

        String complaint = "Location: " + location
                + " | Problem: " + problem;

        complaints.add(complaint);

        System.out.println("Complaint registered successfully!");
    }

    static void viewComplaints() {
        if (complaints.isEmpty()) {
            System.out.println("No complaints registered.");
            return;
        }

        for (int i = 0; i < complaints.size(); i++) {
            System.out.println((i + 1) + ". " + complaints.get(i));
        }
    }

    static void dashboard() {
        int collected = 0;
        int pending = 0;
        int urgentBins = 0;

        for (WasteRequest request : requests) {
            if (request.status.equals("Collected")) {
                collected++;
            } else {
                pending++;
            }
        }

        for (WasteBin bin : bins) {
            if (bin.fillLevel >= 80) {
                urgentBins++;
            }
        }

        System.out.println("\n===== SMART WASTE DASHBOARD =====");
        System.out.println("Total Requests       : " + requests.size());
        System.out.println("Collected Requests   : " + collected);
        System.out.println("Unfinished Requests  : " + pending);
        System.out.println("Registered Bins      : " + bins.size());
        System.out.println("Urgent Bins (80%+)   : " + urgentBins);
        System.out.println("Total Complaints     : " + complaints.size());
        System.out.println("=================================");
    }

    public static void main(String[] args) {
        int choice;

        do {
            System.out.println("\n================================");
            System.out.println("   SMART WASTE MANAGEMENT");
            System.out.println("================================");
            System.out.println("1. Add Collection Request");
            System.out.println("2. View All Requests");
            System.out.println("3. Search Request");
            System.out.println("4. Update Collection Status");
            System.out.println("5. Register Waste Bin");
            System.out.println("6. View Waste Bins");
            System.out.println("7. Register Complaint");
            System.out.println("8. View Complaints");
            System.out.println("9. View Dashboard");
            System.out.println("0. Exit");

            choice = readNumber("Enter your choice: ");

            switch (choice) {
                case 1:
                    addRequest();
                    break;
                case 2:
                    viewRequests();
                    break;
                case 3:
                    searchRequest();
                    break;
                case 4:
                    updateStatus();
                    break;
                case 5:
                    addBin();
                    break;
                case 6:
                    viewBins();
                    break;
                case 7:
                    registerComplaint();
                    break;
                case 8:
                    viewComplaints();
                    break;
                case 9:
                    dashboard();
                    break;
                case 0:
                    System.out.println("Thank you for using Smart Waste Management!");
                    break;
                default:
                    System.out.println("Invalid choice. Please try again.");
            }

        } while (choice != 0);

        sc.close();
    }
}
